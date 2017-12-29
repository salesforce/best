
export async function runBenchmarks(benchmarksBuilds, globalConfig) {
    const results = [];
    for (const benchmarkConfig of benchmarksBuilds) {
        const benchmarkResults = await runBenchmark(benchmarkConfig, globalConfig);
        results.push(benchmarkResults);
    }

    return results;
}

export async function runBenchmark({ benchmarkEntry, proyectConfig, globalConfig }) {
    const { benchmarkRunner } = proyectConfig;
    const runner = require(benchmarkRunner);
    return runner.run(benchmarkEntry, proyectConfig, globalConfig);
}
