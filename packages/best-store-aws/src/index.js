import { S3 } from "./aws-wrapper";
import fs from "fs";
import chalk from "chalk";

const INIT_RUNNING_TEXT = chalk.bold.dim('\nPushing to AWS(S3)... \n');

export function storeResults(fileMap, { benchmarkName, results, projectConfig, stats, benchmarkOutputResult }, globalConfig) {
    const { gitCommit: commit, gitBranch, gitLocalChanges } = globalConfig;
    const { projectName } = projectConfig;
    const branch = gitLocalChanges ? `local/${gitBranch}` : gitBranch;
    const s3 = new S3();

    console.log(INIT_RUNNING_TEXT);

    return Promise.all(Object.keys(fileMap).map((file) => {
        const buffer = fs.readFileSync(fileMap[file]);
        return s3.storeFile(file, buffer, { projectName, branch, commit, benchmarkName });
    }));

}

export { S3 };
