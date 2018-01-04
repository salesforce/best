import { S3 } from "./aws-wrapper";
import fs from "fs";
import chalk from "chalk";

const INIT_RUNNING_TEXT = chalk.bold.dim('\nPushing to AWS(S3)...');
let S3_INSTANCE;

function getS3Instance() {
    if (!S3_INSTANCE) {
        S3_INSTANCE = new S3();
    }
    return S3_INSTANCE;
}

export function storeBenchmarkResults(fileMap, { benchmarkName, benchmarkSignature, results, projectConfig, stats, benchmarkOutputResult }, globalConfig) {
    const { gitCommit, gitBranch, gitLocalChanges } = globalConfig;
    const { projectName } = projectConfig;

    // Replace slashes with underscores so we prevent unambiguouus URLs
    const branch = (gitLocalChanges ? `local/${gitBranch}` : gitBranch).replace(/\//g, '_');
    const commit = gitLocalChanges ? benchmarkSignature : gitCommit;

    console.log(INIT_RUNNING_TEXT);
    const s3 = getS3Instance();
    console.log('Bucket:', `https://${s3.bucket}.s3.amazonaws.com/`, '\n');

    return Promise.all(Object.keys(fileMap).map((file) => {
        const buffer = fs.readFileSync(fileMap[file]);
        return s3.storeFile(file, buffer, { projectName, branch, commit, benchmarkName });
    }));
}

export async function getBenchmarkStats(projectName, baseCommit) {
    const s3 = getS3Instance();
    const benchmarks = await s3.listBenchmarks(projectName);
    //console.log(benchmarks);
}
