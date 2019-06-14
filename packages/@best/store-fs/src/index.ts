import fs from 'fs';
import globby from 'globby';
import path from 'path';

let ROOT_DIR = process.cwd();
const IGNORE_PATHS = [
    '**/node_modules/**',
    '**/__tests__/**'
];

export function initialize({ rootDir }: { rootDir: string }) {
    ROOT_DIR = rootDir || ROOT_DIR;
}

export async function storeBenchmarkResults(
    // fileMap,
    // { benchmarkName, benchmarkSignature, projectConfig },
    // globalConfig,
) {
    throw new Error('Method not implemented yet...');
}

export async function getAllBenchmarkStatsPerCommit(projectName: string, commit: string) {
    const pattern = `**/${projectName}/*.benchmark_${commit}/stats.json`;
    const results = await globby([pattern], { cwd: ROOT_DIR, ignore: IGNORE_PATHS });
    const statsResults = results.map(statsPath => {
        const stats = JSON.parse(fs.readFileSync(path.resolve(ROOT_DIR, statsPath), 'utf8'));
        return { ...stats, projectName };
    });
    return statsResults;
}

export function getProjects() {
    throw new Error('Method not implemented yet...');
}

export function getCommits(/* projectName, branch */) {
    throw new Error('Method not implemented yet...');
}
