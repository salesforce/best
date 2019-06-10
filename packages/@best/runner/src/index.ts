export async function runBenchmarks(benchmarksBuilds: any, globalConfig: any, messager: any) {
    const canRunInBulk = !benchmarksBuilds.some((benchmark: any) => !benchmark.projectConfig.benchmarkRunnerConfig.bulkRun);

    if (canRunInBulk) {
        const allPromises = benchmarksBuilds.map((benchmarkBuild: any) => {
            benchmarkBuild.globalConfig = globalConfig;
            return runBenchmark(benchmarkBuild, messager);
        });

        return Promise.all(allPromises);
    } else {
        const results = [];

        for (const benchmarkBuild of benchmarksBuilds) {
            benchmarkBuild.globalConfig = globalConfig;
            const benchmarkResults = await runBenchmark(benchmarkBuild, messager);
            results.push(benchmarkResults);
        }

        return results;
    }
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
