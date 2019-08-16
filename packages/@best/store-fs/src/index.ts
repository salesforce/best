/*
 * Copyright (c) 2019, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: MIT
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/MIT
*/

import fs from 'fs';
import globby from 'globby';
import { StatsResults } from '@best/types';

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

export async function getAllBenchmarkStatsPerCommit(projectName: string, commit: string): Promise<StatsResults[]> {
    const pattern = `**/${projectName}/*.benchmark_${commit}/stats.json`;
    const results = await globby([pattern], { cwd: ROOT_DIR, ignore: IGNORE_PATHS });
    const statsResults = results.map(statsPath => {
        return JSON.parse(fs.readFileSync(statsPath, 'utf8'));
    });
    return statsResults;
}

export function getProjects() {
    throw new Error('Method not implemented yet...');
}

export function getCommits(/* projectName, branch */) {
    throw new Error('Method not implemented yet...');
}
