import { runnerMessager } from "best-messager";

export async function runBenchmarks(benchmarksBuilds, globalConfig) {
    const results = [];
    for (const benchmarkConfig of benchmarksBuilds) {
        const benchmarkResults = await runBenchmark(benchmarkConfig, globalConfig);
        results.push(benchmarkResults);
    }

    return results;
}

export async function runBenchmark({ benchmarkEntry, proyectConfig, globalConfig}) {
    const { benchmarkRunner } = proyectConfig;
    const runner = require(benchmarkRunner);
    runnerMessager.onBenchmarkStart(benchmarkEntry);
    const results = await runner.run(benchmarkEntry, proyectConfig, globalConfig, runnerMessager);
    runnerMessager.onBenchmarkEnd(benchmarkEntry);
    return results;
}
