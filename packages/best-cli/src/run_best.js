import globby from "globby";
import { buildBenchmarks } from "best-build";
import { runBenchmarks } from "best-runner";
import path from "path";

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
        })
    );
}

async function buildBundleBenchmarks(benchmarksTests, globalConfig) {
    const bundle = await Promise.all(
        benchmarksTests.map(async ({ matches, config }) =>
            buildBenchmarks(matches, config, globalConfig))
    );
    // Flatten the per-project benchmarks tests
    return bundle.reduce((benchmarks, bundle) => {
        benchmarks.push(...bundle);
        return benchmarks;
    }, []);
}

async function runBundleBenchmarks(benchmarksBuilds, globalConfig) {
    return runBenchmarks(benchmarksBuilds, globalConfig);
}

export async function runBest(globalConfig, configs, hasDeprecationWarnings, outputStream) {
    const benchmarksTests = await getBenchmarkTests(configs, globalConfig);
    const benchmarksBuilds = await buildBundleBenchmarks(benchmarksTests, globalConfig);
    const benchmarkBundleResults = await runBundleBenchmarks(benchmarksBuilds, globalConfig);
    return benchmarkBundleResults;
}
