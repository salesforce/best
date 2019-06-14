import { isCI } from '@best/utils';
import GithubApplicationFactory from './git-app';
import { generateComparisonComment } from './comment';

const PULL_REQUEST_URL = process.env.PULL_REQUEST;
const REPO_NAME = process.env.REPO_NAME;

export async function pushBenchmarkComparison(baseCommit: any, targetCommit: any, compareStats: any, { gitRepository }: any) {
    if (!isCI) {
        console.log('[NOT A CI] - The output will not be pushed.\n');
        console.log(generateComparisonComment(baseCommit, targetCommit, compareStats), '\n');
        return;
    }

    if (PULL_REQUEST_URL === undefined || REPO_NAME === undefined) {
        throw new Error('PULL_REQUEST_URL and REPO_NAME enviroment variable is needed');
    }

    const APP = GithubApplicationFactory();
    const gitAppAuth = await APP.authenticateAsApplication();
    const repoInstallation = await gitAppAuth.apps.getRepoInstallation(gitRepository);
    const installationId = repoInstallation.data.id;
    const owner = repoInstallation.data.account.login;
    const gitHubInstallation = await APP.authenticateAsInstallation(installationId);
    const prId: any = PULL_REQUEST_URL.split('/').pop();
    const pullRequestId = parseInt(prId, 10);
    const body = generateComparisonComment(baseCommit, targetCommit, compareStats);

    await gitHubInstallation.issues.createComment({
        owner,
        body,
        repo: REPO_NAME,
        number: pullRequestId,
    });
}

export { GithubApplicationFactory };
