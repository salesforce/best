import { isCI } from '@best/utils';
import { createGithubApp } from './git-app';
import { generateComparisonComment } from './comment';

const PULL_REQUEST_URL = process.env.PULL_REQUEST;
const REPO_NAME = process.env.REPO_NAME;

export async function pushBenchmarkComparison(
    baseCommit,
    targetCommit,
    compareStats,
) {
    if (!isCI) {
        // throw new Error('GitIntegration is only supposed to run on a CI environment');
        console.log('[NOT A CI] - The output will not be pushed.\n');
        console.log(
            generateComparisonComment(baseCommit, targetCommit, compareStats),
            '\n',
        );
        return;
    }

    const APP = createGithubApp();
    const gitAppAuth = await APP.authAsApp();
    const installations = await gitAppAuth.apps.getInstallations({});
    const repoInstallation = installations.data[0];
    const installationId = repoInstallation.id;
    const owner = repoInstallation.account.login;
    const gitHubInstallation = await APP.authAsInstallation(installationId);
    const pullRequestId = parseInt(PULL_REQUEST_URL.split('/').pop(), 10);
    const body = generateComparisonComment(
        baseCommit,
        targetCommit,
        compareStats,
    );

    await gitHubInstallation.issues.createComment({
        owner,
        body,
        repo: REPO_NAME,
        number: pullRequestId,
    });
}
