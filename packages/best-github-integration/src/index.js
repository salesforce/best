import { isCI } from '@best/utils';
import { createGithubApp } from './git-app';
import { generateComparisonComment } from './comment';

const PULL_REQUEST_URL = process.env.PULL_REQUEST;
const REPO_NAME = process.env.REPO_NAME;

export async function pushBenchmarkComparison(baseCommit, targetCommit, compareStats, { gitRepository }) {
    if (!isCI) {
        // throw new Error('GitIntegration is only supposed to run on a CI environment');
        console.log('[NOT A CI] - The output will not be pushed.\n');
        console.log(generateComparisonComment(baseCommit, targetCommit, compareStats), '\n');
        return;
    }

    const repoOwner = gitRepository.owner;
    const APP = createGithubApp();
    const gitAppAuth = await APP.authAsApp();
    const installations = await gitAppAuth.apps.getInstallations({});
    const repoInstallation = installations.data.find((i) => i.account.login === repoOwner);
    const installationId = repoInstallation.id;
    const owner = repoInstallation.account.login;
    const gitHubInstallation = await APP.authAsInstallation(installationId);
    const pullRequestId = parseInt(PULL_REQUEST_URL.split('/').pop(), 10);
    const body = generateComparisonComment(baseCommit, targetCommit, compareStats);

    await gitHubInstallation.issues.createComment({
        owner,
        body,
        repo: REPO_NAME,
        number: pullRequestId,
    });
}
