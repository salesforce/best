import { S3 } from "./aws-wrapper";
import fs from "fs";
import chalk from "chalk";

const INIT_RUNNING_TEXT = chalk.bold.dim('\nPushing to AWS(S3)...');

export function storeResults(fileMap, { benchmarkName, benchmarkSignature, results, projectConfig, stats, benchmarkOutputResult }, globalConfig) {
    const { gitCommit, gitBranch, gitLocalChanges } = globalConfig;
    const { projectName } = projectConfig;

    // Replace slashes with underscores so we prevent unambiguouus URLs
    const branch = (gitLocalChanges ? `local/${gitBranch}` : gitBranch).replace(/\//g, '_');
    const commit = gitLocalChanges ? benchmarkSignature : gitCommit;

    console.log(INIT_RUNNING_TEXT);
    const s3 = new S3();
    console.log('Bucket:', `https://${s3.bucket}.s3.amazonaws.com/`, '\n');

    return Promise.all(Object.keys(fileMap).map((file) => {
        const buffer = fs.readFileSync(fileMap[file]);
        return s3.storeFile(file, buffer, { projectName, branch, commit, benchmarkName });
    }));

}

export { S3 };
