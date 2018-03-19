import fs from 'fs';
import chalk from 'chalk';

const INIT_RUNNING_TEXT = chalk.bold.dim('\nPushing to AWS(S3)...');

export async function storeBenchmarkResults(
    fileMap,
    { benchmarkName, benchmarkSignature, projectConfig },
    globalConfig,
) {
    console.log("WIP");
}

export async function getAllBenchmarkStatsPerCommit(projectName, commit) {
    console.log('WIP');
}

export function getProjects() {
    console.log('WIP');
}

export function getCommits(projectName, branch) {
    console.log('WIP');
}
