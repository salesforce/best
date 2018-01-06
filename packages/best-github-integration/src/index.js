import { createGithubApp } from "./git-app";
import { isCI } from "@best/utils";

const TARGET_COMMIT = process.env.TARGET_COMMIT;
const BASE_COMMIT = process.env.BASE_COMMIT;

export async function pushBenchmarkComparison(compareStats) {
    console.log('BASE >> ', BASE_COMMIT);
    console.log('TARGET >> ', TARGET_COMMIT);

    if (!isCI) {
        //throw new Error('GitIntegration: Some of the environment configuration is not properly setup');
        console.log('SHould not log this in CI');
    }

    const APP = createGithubApp();
    const gitAppAuth = await APP.authAsApp();
    const installations = await gitAppAuth.apps.getInstallations({});

    console.log('>> ', installations);

}
