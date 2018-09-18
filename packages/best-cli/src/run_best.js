import globby from 'globby';
import { buildBenchmarks } from '@best/build';
import { runBenchmarks } from '@best/runner';
import { BuildStateMessager, RunnerMessager } from '@best/messager';
import { storeBenchmarkResults } from '@best/store';
import { analyzeBenchmarks } from '@best/analyzer';
import path from 'path';
import micromatch from 'micromatch';

const IGNORE_PATHS = [
    '**/__benchmarks_results__/**',
    '**/node_modules/**',
    '**/__tests__/**'
];

async function getBenchmarkPaths({ rootDir }, config) {
    const { testMatch, rootDir: projectRoot } = config;
    const cwd = projectRoot || rootDir;
    const ignorePaths = IGNORE_PATHS.concat(config.testPathIgnorePatterns || []);
    const results = await globby(testMatch, { cwd, ignore: ignorePaths });
    return results.map(p => path.resolve(cwd, p));
}

function filterBenchmarks(matches, { nonFlagArgs, rootDir }) {
    if (!nonFlagArgs || !nonFlagArgs.length) {
        return matches;
    }

    const patterns = nonFlagArgs.map(p => {
        // To provide a good test matching we need to disambiguate between
        // glob patterns vs. full path diretory vs a specific file.
        if (p.includes('*')) {
            return p;
        }

        if (path.extname(p)) {
            return path.resolve(rootDir, p);
        }

        return path.join(path.resolve(rootDir, p), '**');
    });

    return micromatch(matches, patterns);
}

function validateBenchmarkNames(matches) {
    matches.reduce((visited, p) => {
        const filename = path.basename(p);
        if (visited[filename]) {
            throw new Error(`Duplicated benchmark filename "${filename}". All benchmark file names must be unique.`);
        }
        visited[filename] = true;
        return visited;
    }, {});
}

async function getBenchmarkTests(configs, globalConfig) {
    return Promise.all(
        configs.map(async config => {
            let matches = await getBenchmarkPaths(globalConfig, config);
            matches = filterBenchmarks(matches, globalConfig);
            validateBenchmarkNames(matches);
            return { config, matches };
        })
    );
}

async function buildBundleBenchmarks(benchmarksTests, globalConfig, messager) {
    const bundle = [];
    // @dval: We don't parallelize here for now since this wouldn't give us much,
    // Unless we do proper spawning on threads
    for (const benchmarkTest of benchmarksTests) {
        const { matches, config } = benchmarkTest;
        const result = await buildBenchmarks(matches, config, globalConfig, messager);
        bundle.push(result);
    }

    // Flatten the per-project benchmarks tests
    return bundle.reduce((benchmarks, benchBundle) => {
        benchmarks.push(...benchBundle);
        return benchmarks;
    }, []);
}

async function runBundleBenchmarks(benchmarksBuilds, globalConfig, messager) {
    return runBenchmarks(benchmarksBuilds, globalConfig, messager);
}

function hasMatches(benchmarksTests) {
    return benchmarksTests.some(({ matches }) => matches.length);
}

export async function runBest(globalConfig, configs, outputStream) {
    const benchmarksTests = await getBenchmarkTests(configs, globalConfig);

    if (!hasMatches(benchmarksTests)) {
        outputStream.write('No benchmark matches found. \n');
        return [];
    }

    const buildMessager = new BuildStateMessager(benchmarksTests, globalConfig, outputStream);
    const benchmarksBuilds = await buildBundleBenchmarks(benchmarksTests, globalConfig, buildMessager);
    buildMessager.finishBuild();

    const runnerMessager = new RunnerMessager(benchmarksBuilds, globalConfig, outputStream);
    const benchmarkBundleResults = await runBundleBenchmarks(benchmarksBuilds, globalConfig, runnerMessager);
    runnerMessager.finishRun();

    await analyzeBenchmarks(benchmarkBundleResults, globalConfig);
    await storeBenchmarkResults(benchmarkBundleResults, globalConfig);

    return benchmarkBundleResults;
}
