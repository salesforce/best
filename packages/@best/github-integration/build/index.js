"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const utils_1 = require("@best/utils");
const git_app_1 = require("./git-app");
exports.createGithubApp = git_app_1.createGithubApp;
const comment_1 = require("./comment");
const PULL_REQUEST_URL = process.env.PULL_REQUEST;
const REPO_NAME = process.env.REPO_NAME;
async function pushBenchmarkComparison(baseCommit, targetCommit, compareStats, { gitRepository }) {
    if (!utils_1.isCI) {
        // throw new Error('GitIntegration is only supposed to run on a CI environment');
        console.log('[NOT A CI] - The output will not be pushed.\n');
        console.log(comment_1.generateComparisonComment(baseCommit, targetCommit, compareStats), '\n');
        return;
    }
    if (PULL_REQUEST_URL === undefined || REPO_NAME === undefined) {
        throw new Error('PULL_REQUEST_URL and REPO_NAME enviroment variable is needed');
    }
    const repoOwner = gitRepository.owner;
    const APP = git_app_1.createGithubApp();
    const gitAppAuth = await APP.authAsApp();
    const installations = await gitAppAuth.apps.getInstallations({});
    const repoInstallation = installations.data.find((i) => i.account.login === repoOwner);
    const installationId = repoInstallation.id;
    const owner = repoInstallation.account.login;
    const gitHubInstallation = await APP.authAsInstallation(installationId);
    const prId = PULL_REQUEST_URL.split('/').pop();
    const pullRequestId = parseInt(prId, 10);
    const body = comment_1.generateComparisonComment(baseCommit, targetCommit, compareStats);
    await gitHubInstallation.issues.createComment({
        owner,
        body,
        repo: REPO_NAME,
        number: pullRequestId,
    });
}
exports.pushBenchmarkComparison = pushBenchmarkComparison;
//# sourceMappingURL=index.js.map