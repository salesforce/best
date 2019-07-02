import { S3, AWS_TEXT } from './aws-wrapper';
import fs from 'fs';
import chalk from 'chalk';
import fetch from 'node-fetch';
import { BenchmarkResultsSnapshot, FrozenGlobalConfig } from '@best/types';

const INIT_RUNNING_TEXT = chalk.bold.dim('\nPushing to AWS(S3)...');
let S3_INSTANCE: S3;

function getS3Instance() {
    if (!S3_INSTANCE) {
        S3_INSTANCE = new S3();
    }
    return S3_INSTANCE;
}

export function initialize(/* config */) {
    getS3Instance();
}

export async function storeBenchmarkResults(
    fileMap: { [key: string]: string },
    { benchmarkInfo: { benchmarkName, benchmarkSignature }, projectConfig } : BenchmarkResultsSnapshot,
    globalConfig: FrozenGlobalConfig,
) {
    const { gitInfo: { localChanges: gitLocalChanges, branch: gitBranch, lastCommit: { hash: gitCommit } } } = globalConfig;
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
                commit,
                benchmarkName,
            });
        }),
    );

    // This will allow us to search in the bucket by brach/commit
    await s3.storeBranchCommitIndex(projectName, branch, commit);
}

export async function getAllBenchmarkStatsPerCommit(projectName: string, commit: string) {
    const s3 = getS3Instance();
    const benchmarks = await s3.getBenchmarkUrlsForCommit(projectName, commit);
    if (benchmarks && benchmarks.length) {
        console.log(AWS_TEXT + ` Fetching benchmarks for commit ${commit}...`);
        return Promise.all(
            benchmarks.map(async url => {
                const fullUrl = url + '/stats.json';
                console.log(AWS_TEXT + ` Fetching benchmark ${fullUrl}`);
                const response = await fetch(fullUrl);
                const json = await response.json();
                return Object.assign(json, { projectName });
            }),
        );
    }
    return benchmarks;
}

export function getProjects() {
    const s3 = getS3Instance();
    return s3.getProjects();
}

export function getCommits(projectName: string, branch: string) {
    const s3 = getS3Instance();
    return s3.getCommits(projectName, branch);
}
