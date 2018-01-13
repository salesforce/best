import globby from 'globby';
import { buildBenchmarks } from '@best/build';
import { runBenchmarks } from '@best/runner';
import { buildStateMessager, runnerMessager } from '@best/messager';
import { storeBenchmarkResults } from '@best/store';
import { analyzeBenchmarks } from '@best/analyzer';
import path from 'path';

async function getBenchmarkPaths(globalConfig, config) {
    const rootDir = globalConfig.rootDir;
    const { testMatch } = config;
    const results = await globby(testMatch, { cwd: rootDir });
    return results.map(p => path.resolve(rootDir, p));
}

async function getBenchmarkTests(configs, globalConfig) {
    return Promise.all(
        configs.map(async config => {
            const matches = await getBenchmarkPaths(globalConfig, config);
            return { config, matches };
        }),
    );
}

async function buildBundleBenchmarks(benchmarksTests, globalConfig) {
    const bundle = await Promise.all(
        benchmarksTests.map(async ({ matches, config }) =>
            buildBenchmarks(matches, config, globalConfig),
        ),
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

    buildStateMessager.initBuild(benchmarksTests, globalConfig, outputStream);
    const benchmarksBuilds = await buildBundleBenchmarks(
        benchmarksTests,
        globalConfig,
    );
    buildStateMessager.finishBuild();

    runnerMessager.initRun(benchmarksBuilds, globalConfig, outputStream);
    const benchmarkBundleResults = await runBundleBenchmarks(
        benchmarksBuilds,
        globalConfig,
        runnerMessager,
    );
    runnerMessager.finishRun();

    await analyzeBenchmarks(benchmarkBundleResults, globalConfig);
    await storeBenchmarkResults(benchmarkBundleResults, globalConfig);

    return benchmarkBundleResults;
}
