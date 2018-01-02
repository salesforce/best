export async function runBenchmarks(benchmarksBuilds, globalConfig, messager) {
    const results = [];
    for (const benchmarkBuild of benchmarksBuilds) {
        benchmarkBuild.globalConfig = globalConfig;
        const benchmarkResults = await runBenchmark(benchmarkBuild, messager);
        results.push(benchmarkResults);
    }

    return results;
}

export async function runBenchmark({ benchmarkName, benchmarkEntry, benchmarkSignature, proyectConfig, globalConfig }, messager) {
    const { benchmarkRunner } = proyectConfig;
    const runner = require(benchmarkRunner);

    const benchmarkBundleName = { benchmarkName, benchmarkEntry, benchmarkSignature };
    const results = await runner.run(benchmarkBundleName, proyectConfig, globalConfig, messager);

    results.benchmarkSignature = benchmarkSignature;
    results.benchmarkName = benchmarkName;
    results.benchmarkEntry = benchmarkEntry;
    results.proyectConfig = proyectConfig;

    return results;
}
