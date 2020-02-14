/*
 * Copyright (c) 2019, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: MIT
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/MIT
*/

import path from 'path';
import micromatch from 'micromatch';
import fg from 'fast-glob';

import { buildBenchmarks } from '@best/builder';
import { runBenchmarks } from '@best/runner';
import { BuildOutputStream, RunnerOutputStream } from "@best/console-stream";
import { storeBenchmarkResults } from '@best/store';
import { saveBenchmarkSummaryInDB } from '@best/api-db';
import { analyzeBenchmarks } from '@best/analyzer';
import { FrozenGlobalConfig, FrozenProjectConfig, BenchmarksBundle } from "@best/types";

async function getBenchmarkPaths(config: FrozenProjectConfig): Promise<string[]> {
    const { testMatch, testPathIgnorePatterns, rootDir: cwd } = config;
    const ignore = [ ...testPathIgnorePatterns];
    const results = await fg(testMatch, { onlyFiles: true, ignore, cwd });
    return results.map((benchPath: string) => path.resolve(cwd, benchPath));
}

function filterBenchmarks(matches: string[], filters: string[]) {
    if (!filters || !filters.length) {
        return matches;
    }
    // We are doing a OR with the filters (we return the sum of them matches)
    const filteredMatches = filters.reduce((reducer: string[], filter: string): string[] => {
        let newMatches: string[];
        if (filter.includes('*')) {
            newMatches = micromatch(matches, filter);
        } else {
            newMatches = matches.filter((match) => match.includes(filter));
        }

        return [...reducer, ...newMatches];
    }, []);

    // Dedupe results (not the most efficient, but the most idiomatic)
    return Array.from(new Set(filteredMatches));
}

function validateBenchmarkNames(matches: string[]) {
    matches.reduce((visited: Set<string>, p: string) => {
        const filename = path.basename(p);

        if (visited.has(p)) {
            throw new Error(`Duplicated benchmark filename "${filename}". All benchmark file names must be unique.`);
        }
        return visited.add(filename);
    }, new Set());
}

async function getBenchmarkTests(projectConfigs: FrozenProjectConfig[], globalConfig: FrozenGlobalConfig): Promise<{ config: FrozenProjectConfig, matches: string[] }[]> {
    return Promise.all(projectConfigs.map(async (projectConfig: FrozenProjectConfig) => {
        const allBenchmarks = await getBenchmarkPaths(projectConfig);
        const filteredBenchmarks = filterBenchmarks(allBenchmarks, globalConfig.nonFlagArgs);
        validateBenchmarkNames(filteredBenchmarks);
        return { config: projectConfig, matches: filteredBenchmarks };
    }));
}

async function buildBundleBenchmarks(benchmarksTests: { config: FrozenProjectConfig; matches: string[] }[], globalConfig: FrozenGlobalConfig, messager: BuildOutputStream): Promise<BenchmarksBundle[]> {
    const benchmarkBuilds: BenchmarksBundle[] = [];
    // We wait for each project to run before starting the next batch
    for (const benchmarkTest of benchmarksTests) {
        const { matches, config } = benchmarkTest;
        const result = await buildBenchmarks(matches, config, globalConfig, messager);

        benchmarkBuilds.push({
            projectName: config.projectName,
            projectConfig: config,
            globalConfig,
            benchmarkBuilds: result
        });
    }

    return benchmarkBuilds;
}

function hasMatches(benchmarksTests: { config: FrozenProjectConfig, matches: string[] }[]) {
    return benchmarksTests.some(({ matches }) => matches.length);
}

export async function runBest(globalConfig: FrozenGlobalConfig, configs: FrozenProjectConfig[], outputStream: NodeJS.WriteStream) {
    const benchmarksTests = await getBenchmarkTests(configs, globalConfig);

    if (!hasMatches(benchmarksTests)) {
        outputStream.write('No benchmark matches found. \n');
        return [];
    }

    let benchmarksBuilds;
    const buildLogStream = new BuildOutputStream(benchmarksTests, outputStream, globalConfig.isInteractive);
    try {
        buildLogStream.init();
        benchmarksBuilds = await buildBundleBenchmarks(benchmarksTests, globalConfig, buildLogStream);
    } finally {
        buildLogStream.finish();
    }

    let benchmarkBundleResults;
    const runnerLogStream = new RunnerOutputStream(benchmarksBuilds, outputStream, globalConfig.isInteractive);
    try {
        runnerLogStream.init();
        benchmarkBundleResults = await runBenchmarks(benchmarksBuilds, runnerLogStream);
        console.log(benchmarkBundleResults[0]);
    } finally {
        runnerLogStream.finish();
    }

    await analyzeBenchmarks(benchmarkBundleResults);
    await storeBenchmarkResults(benchmarkBundleResults, globalConfig);
    await saveBenchmarkSummaryInDB(benchmarkBundleResults, globalConfig);

    return benchmarkBundleResults;
}
