import fs from 'fs';
import chalk from 'chalk';
import globby from 'globby';

let ROOT_DIR = process.cwd();
const IGNORE_PATHS = [
    '**/node_modules/**',
    '**/__tests__/**'
];

export function initialize({ rootDir }) {
    ROOT_DIR = rootDir || ROOT_DIR;
}

export async function storeBenchmarkResults(
    fileMap,
    { benchmarkName, benchmarkSignature, projectConfig },
    globalConfig,
) {
    console.log("WIP");
}

export async function getAllBenchmarkStatsPerCommit(projectName, commit) {
    const pattern = `'**/${projectName}/*.benchmark_${commit}/stats.json'`;
    const results = await globby([pattern], { cwd: ROOT_DIR, ignore: IGNORE_PATHS });
    const statsResults = results.map(statsPath => {
        const stats = JSON.parse(fs.readFileSync(statsPath, 'utf8'));
        return { ...stats, projectName };
    });
    return statsResults;
}

export function getProjects() {
    console.log('WIP');
}

export function getCommits(projectName, branch) {
    console.log('WIP');
}
