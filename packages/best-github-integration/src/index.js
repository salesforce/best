import { isCI } from "@best/utils";
import { createGithubApp } from "./git-app";
import { generateComparisonComment } from "./comment";

const TARGET_COMMIT = process.env.TARGET_COMMIT;
const BASE_COMMIT = process.env.BASE_COMMIT;
const PULL_REQUEST_URL = process.env.PULL_REQUEST;
const REPO_NAME = process.env.REPO_NAME;

export async function pushBenchmarkComparison(compareStats) {
    if (!isCI) {
        throw new Error('GitIntegration is only supposed to run on a CI environment');
    }

    const APP = createGithubApp();
    const gitAppAuth = await APP.authAsApp();
    const installations = await gitAppAuth.apps.getInstallations({});
    const repoInstallation = installations.data[0];
    const installationId = repoInstallation.id;
    const owner = repoInstallation.account.login;
    const gitHubInstallation = await APP.asInstallation(installationId);
    const pullRequestId = parseInt(PULL_REQUEST_URL.split('/').pop(), 10);
    const comparisonComment = generateComparisonComment(BASE_COMMIT, TARGET_COMMIT, compareStats);

    await gitHubInstallation.issues.createComment({
        owner,
        repo: REPO_NAME,
        number: pullRequestId,
        body: comparisonComment
    });
}
