import Octokit from '@octokit/rest';
import { isCI } from '@best/utils';
import { loadDbFromConfig } from '@best/api-db';
import GithubApplicationFactory from './git-app';
import { generateComparisonComment } from './comment';
import { FrozenGlobalConfig, BenchmarkComparison, ResultComparison, BenchmarkMetricNames } from '@best/types';

const PULL_REQUEST_URL = process.env.PULL_REQUEST;

// this takes all the results and recursively goes through them
// then it creates a flat list of all of the percentages of change
function generatePercentages(stats: ResultComparison, rows: number[] = []): number[] {
    if (stats.type === "project" || stats.type === "group") {
        return stats.comparisons.reduce((allRows, node: ResultComparison) => {
            if (node.type === "project" || node.type === "group") {
                generatePercentages(node, rows);
            } else if (node.type === "benchmark") {
                Object.keys(node.metrics).forEach(metricName => {
                    const metrics = node.metrics[metricName as BenchmarkMetricNames];

                    if (metrics) {
                        const { baseStats, targetStats } = metrics;
                        const baseMed = baseStats.median;
                        const targetMed = targetStats.median;
            
                        const percentage = Math.abs((baseMed - targetMed) / baseMed * 100);
                        const relativeTrend = targetMed - baseMed;
            
                        allRows.push(Math.sign(relativeTrend) * percentage);
                    }
                })
            }
            return allRows;
        }, rows);
    }

    return rows;
}

function calculateAverageChange(result: BenchmarkComparison) {
    const flattenedValues = result.comparisons.reduce((all, node): number[] => {
        return [...all, ...generatePercentages(node)]
    }, <number[]>[])

    if (flattenedValues.length === 0) {
        return 0;
    }

    const sum = flattenedValues.reduce((previous, current) => current += previous);
    const avg = sum / flattenedValues.length;

    return avg;
}

export async function updateLatestRelease(projectNames: string[], globalConfig: FrozenGlobalConfig): Promise<boolean> {
    try {
        const { gitInfo: { repo: { repo, owner } } } = globalConfig;
        
        const db = loadDbFromConfig(globalConfig);

        const app = GithubApplicationFactory();
        const gitHubInstallation = await app.authenticateAsAppAndInstallation({ repo, owner });

        const results = await gitHubInstallation.repos.listReleases({ repo, owner });
        if (results.data.length > 0) {
            const latestRelease = results.data[0];
            await Promise.all(projectNames.map(async (name) => {
                return db.updateLastRelease(name, latestRelease.created_at);
            }))
        }
    } catch (err) {
        return false;
    }

    return true;
}

export async function beginBenchmarkComparisonCheck(targetCommit: string, { gitInfo }: FrozenGlobalConfig): Promise<{ check?: Octokit.ChecksCreateResponse, gitHubInstallation?: Octokit }> {
    if (!isCI) {
        console.log('[NOT A CI] - The output will not be pushed.\n');
        return {};
    }

    if (PULL_REQUEST_URL === undefined) {
        throw new Error('PULL_REQUEST_URL enviroment variable is needed');
    }

    const { repo: { repo, owner } } = gitInfo;
    const app = GithubApplicationFactory();
    const gitHubInstallation = await app.authenticateAsAppAndInstallation({ repo, owner });

    const result = await gitHubInstallation.checks.create({
        owner,
        repo,
        name: 'best',
        head_sha: targetCommit,
        status: 'in_progress'
    })

    const check = result.data

    return { check, gitHubInstallation }
}

export async function failedBenchmarkComparisonCheck(gitHubInstallation: Octokit, check: Octokit.ChecksCreateResponse, error: string, globalConfig: FrozenGlobalConfig) {
    const { repo: { repo, owner }  } = globalConfig.gitInfo;
    const now = (new Date()).toISOString();
    const failureComment = 'Best failed with the following error:\n\n```' + error + '```';

    await gitHubInstallation.checks.update({
        owner,
        repo,
        check_run_id: check.id,
        completed_at: now,
        conclusion: 'failure',
        output: {
            title: 'Best Performance',
            summary: failureComment
        }
    })
}

export async function completeBenchmarkComparisonCheck(gitHubInstallation: Octokit, check: Octokit.ChecksCreateResponse, comparison: BenchmarkComparison, globalConfig: FrozenGlobalConfig) {
    const { repo: { repo, owner }  } = globalConfig.gitInfo;
    const body = generateComparisonComment(comparison);
    const now = (new Date()).toISOString();

    await gitHubInstallation.checks.update({
        owner,
        repo,
        check_run_id: check.id,
        completed_at: now,
        conclusion: 'success',
        output: {
            title: 'Best Performance',
            summary: body
        }
    })

    const averageChange = calculateAverageChange(comparison);
    const highThreshold = Math.abs(globalConfig.commentThreshold); // handle whether the threshold is positive or negative
    const lowThreshold = -1 * highThreshold;
    const significantlyImproved = averageChange < lowThreshold; // less than a negative is GOOD (things got faster)
    const significantlyRegressed = averageChange > highThreshold; // more than a positive is WORSE (things got slower)

    if ((significantlyRegressed || significantlyImproved) && PULL_REQUEST_URL !== undefined) {
        const prId: any = PULL_REQUEST_URL.split('/').pop();
        const pullRequestId = parseInt(prId, 10);

        let comment: string;
        if (significantlyRegressed) {
            comment = `# ⚠ Performance Regression\n\nBest has detected that there is a \`${Math.abs(averageChange).toFixed(1)}%\` performance regression across your benchmarks.\n\nPlease [click here](${check.html_url}) to see more details.`
        } else {
            comment = `# 🥳 Performance Improvement\n\nBest has detected that there is a \`${Math.abs(averageChange).toFixed(1)}%\` performance improvement across your benchmarks.\n\nPlease [click here](${check.html_url}) to see more details.`
        }

        await gitHubInstallation.issues.createComment({
            owner,
            repo,
            issue_number: pullRequestId,
            body: comment
        });
    }
}

export { GithubApplicationFactory };
