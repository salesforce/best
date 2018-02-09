import globby from 'globby';
import { buildBenchmarks } from '@best/build';
import { runBenchmarks } from '@best/runner';
import { BuildStateMessager, RunnerMessager } from '@best/messager';
import { storeBenchmarkResults } from '@best/store';
import { analyzeBenchmarks } from '@best/analyzer';
import path from 'path';

async function getBenchmarkPaths({ nonFlagArgs, rootDir }, config) {
    const { testMatch, rootDir: projectRoot } = config;
    const rootPath = projectRoot || rootDir;
    const paths = nonFlagArgs && nonFlagArgs.length ? nonFlagArgs : testMatch;
    const results = await globby(paths, { cwd: rootPath });
    return results.map(p => path.resolve(rootPath, p));
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
            const matches = await getBenchmarkPaths(globalConfig, config);
            validateBenchmarkNames(matches);
            return { config, matches };
        })
    );
}

async function buildBundleBenchmarks(benchmarksTests, globalConfig, messager) {
    const bundle = await Promise.all(
        benchmarksTests.map(async ({ matches, config }) => buildBenchmarks(matches, config, globalConfig, messager)),
    );
    // Flatten the per-project benchmarks tests
    return bundle.reduce((benchmarks, benchBundle) => {
        benchmarks.push(...benchBundle);
        return benchmarks;
    }, []);
}

async function runBundleBenchmarks(benchmarksBuilds, globalConfig, messager) {
    return runBenchmarks(benchmarksBuilds, globalConfig, messager);
}

export async function runBest(globalConfig, configs, outputStream) {
    const benchmarksTests = await getBenchmarkTests(configs, globalConfig);

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
