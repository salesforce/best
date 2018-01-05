import { preRunMessager } from "@best/messager";
import { isCI } from "@best/utils";

const APP_ID = process.env.GIT_APP_ID;
const APP_CERT = process.env.GIT_APP_CERT;
const TARGET_COMMIT = process.env.TARGET_COMMIT;
const BASE_COMMIT = process.env.BASE_COMMIT;

function checkIntegrationEnviroment() {
    return isCI && APP_ID && APP_CERT;
}

export async function pushBenchmarkComparison(compareStats) {
    console.log('APP_ID >> ', APP_ID);
    console.log('APP_CERT >> ', APP_CERT);
    console.log('BASE >> ', BASE_COMMIT);
    console.log('TARGET >> ', TARGET_COMMIT);

    if (!checkIntegrationEnviroment()) {
        //throw new Error('GitIntegration: Some of the environment configuration is not properly setup');
    }
}
