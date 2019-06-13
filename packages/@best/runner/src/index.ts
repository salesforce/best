function getBatchSize(benchmarkSize: number): number {
    if (benchmarkSize < 10) {
        return 1;
    } else if (benchmarkSize < 50) {
        return 2;
    } else {
        return 3;
    }
}

async function runBenchmarksInBatch(batchSize: number, benchmarksBuilds: any, globalConfig: any, messager: any) {
    const results : any[] = [];
    let batch = [];

    for (const benchmarkBuild of benchmarksBuilds) {
        benchmarkBuild.globalConfig = globalConfig;
        batch.push(runBenchmark(benchmarkBuild, messager));

        if (batch.length === batchSize) {
            const batchResults = await Promise.all(batch);
            Array.prototype.push.apply(results, batchResults);
            batch = [];
        }
    }

    if (batch.length) {
        const batchResults = await Promise.all(batch);
        Array.prototype.push.apply(results, batchResults);
    }

    return results;
}

export async function runBenchmarks(benchmarksBuilds: any, globalConfig: any, messager: any) {
    const results : any[] = [];
    const canRunInBatch = !benchmarksBuilds.some((benchmark: any) => !benchmark.projectConfig.benchmarkRunnerConfig.runInBatch);

    if (canRunInBatch) {
        return runBenchmarksInBatch(
            getBatchSize(benchmarksBuilds.length),
            benchmarksBuilds,
            globalConfig,
            messager
        );
    } else {
        for (const benchmarkBuild of benchmarksBuilds) {
            benchmarkBuild.globalConfig = globalConfig;
            const benchmarkResults = await runBenchmark(benchmarkBuild, messager);
            results.push(benchmarkResults);
        }
    }

    return results;
}

export async function runBenchmark(
    { benchmarkName, benchmarkEntry, benchmarkSignature, projectConfig, globalConfig }:{ benchmarkName: string, benchmarkEntry: string, benchmarkSignature: string, projectConfig: any, globalConfig: any },
    messager: any,
) {
    const { benchmarkRunner } = projectConfig;

    // Allow runners with various module signatures to be plugged in.
    let Runner;
    try {
        Runner = require(benchmarkRunner);
        Runner = Runner.Runner || Runner.default || Runner;
    } catch (e) {
        throw new Error(`Runner "${benchmarkRunner}" not found.`);
    }
    // Construct a runner.
    let runner;
    try {
        runner = new Runner();
    } catch (e) {
        throw new Error(`Runner "${benchmarkRunner}" does not expose a constructor.`);
    }

    const benchmarkBundleName = {
        benchmarkName,
        benchmarkEntry,
        benchmarkSignature,
    };
    const results = await runner.run(benchmarkBundleName, projectConfig, globalConfig, messager);

    results.benchmarkSignature = benchmarkSignature;
    results.benchmarkName = benchmarkName;
    results.benchmarkEntry = benchmarkEntry;
    results.projectConfig = projectConfig;

    return results;
}
