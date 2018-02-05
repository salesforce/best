import { S3, AWS_TEXT } from './aws-wrapper';
import fs from 'fs';
import chalk from 'chalk';
import fetch from 'node-fetch';

const INIT_RUNNING_TEXT = chalk.bold.dim('\nPushing to AWS(S3)...');
let S3_INSTANCE;

function getS3Instance() {
    if (!S3_INSTANCE) {
        S3_INSTANCE = new S3();
    }
    return S3_INSTANCE;
}

export async function storeBenchmarkResults(
    fileMap,
    { benchmarkName, benchmarkSignature, projectConfig },
    globalConfig,
) {
    const { gitCommit, gitBranch, gitLocalChanges } = globalConfig;
    const { projectName } = projectConfig;

    // Replace slashes with underscores so we prevent ambiguous URLs
    const branch = (gitLocalChanges ? `local/${gitBranch}` : gitBranch).replace(/\//g, '_');
    const commit = gitLocalChanges ? `${gitCommit}_${benchmarkSignature.slice(0, 7)}` : gitCommit.slice(0, 7);

    console.log(INIT_RUNNING_TEXT);
    const s3 = getS3Instance();
    console.log('Bucket:', `https://${s3.bucket}.s3.amazonaws.com/`, '\n');

    await Promise.all(
        Object.keys(fileMap).map(file => {
            const buffer = fs.readFileSync(fileMap[file]);
            return s3.storeBenchmarkFile(file, buffer, {
                projectName,
                branch,
                commit,
                benchmarkName,
            });
        }),
    );

    // This will allow us to search in the bucket by brach/commit
    await s3.storeBranchCommitIndex(projectName, branch, commit);
}

export async function getBenchmarkStats(projectName, commit) {
    const s3 = getS3Instance();
    const benchmarks = await s3.getBenchmarkUrlsForCommit(projectName, commit);
    console.log(AWS_TEXT + ` Fetching benchmarks for commit ${commit}...`);
    return Promise.all(
        benchmarks.map(async url => {
            const fullUrl = url + '/stats.json';
            console.log(AWS_TEXT + ` Fetching benchmark ${fullUrl}`);
            const response = await fetch(fullUrl);
            return response.json();
        }),
    );
}

export function getProjects() {
    const s3 = getS3Instance();
    return s3.getProjects();
}

export function getCommits(projectName, branch) {
    const s3 = getS3Instance();
    return s3.getCommits();
}
