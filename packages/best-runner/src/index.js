
export async function runBenchmarks(benchmarksBuilds, globalConfig) {
    const results = [];
    for (const benchmark of benchmarksBuilds) {
        const result = await runBenchmark(benchmark, globalConfig);
        results.push({ benchmark, result });
    }

    return results;
}

export async function runBenchmark({ benchmarkEntry, proyectConfig, globalConfig }) {
    const { benchmarkRunner } = proyectConfig;
    const runner = require(benchmarkRunner);

    await runner.run(benchmarkEntry, proyectConfig, globalConfig);
    return { wip: true };
}
