import { BuildConfig } from "@best/builder";
import { FrozenGlobalConfig } from "@best/config";
import { RunnerOutputStream } from "@best/console-stream";

export async function runBenchmarks(benchmarksBuilds: BuildConfig[], globalConfig: FrozenGlobalConfig, messager: RunnerOutputStream) {
    const results = [];
    for (const benchmarkBuild of benchmarksBuilds) {
        const benchmarkResults = await runBenchmark(benchmarkBuild, messager);
        results.push(benchmarkResults);
    }

    return results;
}

export async function runBenchmark(benchmarkBuild: BuildConfig, messager: RunnerOutputStream) {
    const { benchmarkName, benchmarkEntry, benchmarkSignature, projectConfig, globalConfig } = benchmarkBuild;
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
