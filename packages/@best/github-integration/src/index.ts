import Octokit from '@octokit/rest';
import { isCI } from '@best/utils';
import { loadDbFromConfig } from '@best/api-db';
import GithubApplicationFactory from './git-app';
import { generateComparisonComment } from './comment';
import { FrozenGlobalConfig, BenchmarkComparison } from '@best/types';

const PULL_REQUEST_URL = process.env.PULL_REQUEST;

function generatePercentages(stats: any, rows = []) {
    return stats.comparison.reduce((allRows: any, node: any) => {
        if (node.comparison) {
            generatePercentages(node, rows);
        } else {
            const durationMetric = node.metrics.duration;
            const { baseStats, targetStats } = durationMetric;
            const baseMed = baseStats.median;
            const targetMed = targetStats.median;

            const percentage = Math.abs((baseMed - targetMed) / baseMed * 100);
            const relativeTrend = targetMed - baseMed;

            allRows.push(Math.sign(relativeTrend) * percentage);
        }
        return allRows;
    }, rows);
}

function calculateAverageChange(compareStats: any) {
    const values: number[] = generatePercentages(compareStats);

    let sum = values.reduce((previous, current) => current += previous);
    let avg = sum / values.length;

    return avg;
}

export async function updateLatestRelease(projectNames: string[], globalConfig: FrozenGlobalConfig): Promise<void> {
    try {
        const { gitInfo: { repo: { repo, owner } } } = globalConfig;
        
        const db = loadDbFromConfig(globalConfig);

        if (! db) { return; }

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
        
    }
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

export async function pushBenchmarkComparisonCheck(gitHubInstallation: Octokit, check: Octokit.ChecksCreateResponse, comparison: BenchmarkComparison, globalConfig: FrozenGlobalConfig) {
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
    const significantlyRegressed = averageChange < lowThreshold; // less than a negative is WORSE
    const significantlyImproved = averageChange > highThreshold; // more than a positive is GOOD

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
