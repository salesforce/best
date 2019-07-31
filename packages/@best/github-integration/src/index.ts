import Octokit from '@octokit/rest';
import { isCI } from '@best/utils';
import { loadDbFromConfig } from '@best/api-db';
import GithubApplicationFactory from './git-app';
import { generateComparisonComment, generatePercentages, generateComparisonSummary } from './analyze';
import { FrozenGlobalConfig, BenchmarkComparison } from '@best/types';

const PULL_REQUEST_URL = process.env.PULL_REQUEST;

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

        await db.migrate();

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
    const comparisonComment = generateComparisonComment(comparison);
    const comparisonSummary = generateComparisonSummary(comparison, globalConfig.commentThreshold);
    const now = (new Date()).toISOString();
    const { baseCommit, targetCommit } = comparison;

    const summary = `Base commit: \`${baseCommit}\` | Target commit: \`${targetCommit}\`\n\n${comparisonSummary}`;

    await gitHubInstallation.checks.update({
        owner,
        repo,
        check_run_id: check.id,
        completed_at: now,
        conclusion: 'success',
        output: {
            title: 'Best Summary',
            summary,
            text: comparisonComment
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

        if (comparisonSummary && comparisonSummary.length > 0) {
            comment += `<details><summary>Click to view significantly changed benchmarks</summary>\n\n${comparisonSummary}</details>`;
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
