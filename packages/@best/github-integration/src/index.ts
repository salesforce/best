import { isCI } from '@best/utils';
import GithubApplicationFactory from './git-app';
import { generateComparisonComment } from './comment';

const PULL_REQUEST_URL = process.env.PULL_REQUEST;

export async function pushBenchmarkComparison(baseCommit: any, targetCommit: any, compareStats: any, { gitRepository }: any) {
    if (!isCI) {
        console.log('[NOT A CI] - The output will not be pushed.\n');
        // only while in development...
        // console.log(generateComparisonComment(baseCommit, targetCommit, compareStats), '\n');
        // return;
    }

    if (PULL_REQUEST_URL === undefined) {
        throw new Error('PULL_REQUEST_URL enviroment variable is needed');
    }

    const { repo, owner } = gitRepository;
    const APP = GithubApplicationFactory();
    const gitAppAuth = await APP.authenticateAsApplication();
    const repoInstallation = await gitAppAuth.apps.getRepoInstallation(gitRepository);
    const installationId = repoInstallation.data.id;
    const gitHubInstallation = await APP.authenticateAsInstallation(installationId);
    const body = generateComparisonComment(baseCommit, targetCommit, compareStats);
    const now = (new Date()).toISOString();

    await gitHubInstallation.checks.create({
        owner,
        repo,
        name: 'best',
        head_sha: targetCommit,
        completed_at: now,
        conclusion: 'success',
        output: {
            title: 'Best Performance',
            summary: body
        }
    })

    // next ---
    // - threshold
    // - create in progress before test suite runs
    // - comment if below threshold


    // const prId: any = PULL_REQUEST_URL.split('/').pop();
    // const pullRequestId = parseInt(prId, 10);

    // await gitHubInstallation.issues.createComment({
    //     owner,
    //     body,
    //     repo: REPO_NAME,
    //     number: pullRequestId,
    // });
}

export { GithubApplicationFactory };
