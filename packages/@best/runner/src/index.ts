import { BuildConfig } from "@best/builder";
import { FrozenGlobalConfig } from "@best/config";
import { RunnerOutputStream } from "@best/console-stream";
import AbstractRunner from "@best/runner-abstract";

export async function runBenchmarks(benchmarksBuilds: BuildConfig[], globalConfig: FrozenGlobalConfig, messager: RunnerOutputStream) {
    const results = [];
    for (const benchmarkBuild of benchmarksBuilds) {
        const benchmarkResults = await runBenchmark(benchmarkBuild, messager);
        results.push(benchmarkResults);
    }

    return results;
}

interface ConcreteRunner extends AbstractRunner {
    new(config?: any): ConcreteRunner;
}

export async function runBenchmark(benchmarkBuild: BuildConfig, runnerLogStream: RunnerOutputStream) {
    const { benchmarkName, benchmarkEntry, benchmarkFolder, benchmarkSignature, projectConfig, globalConfig } = benchmarkBuild;
    const { benchmarkRunner } = projectConfig;

    // Allow runners with various module signatures to be plugged in.
    let Runner: ConcreteRunner;
    try {
        const RunnerModule: any = require(benchmarkRunner);
        Runner = RunnerModule.Runner || RunnerModule.default || RunnerModule;
    } catch (e) {
        throw new Error(`Runner "${benchmarkRunner}" not found.`);
    }
    // Construct a runner.
    let runner;
    try {
        runner = new Runner(projectConfig.benchmarkRunnerConfig);
    } catch (e) {
        throw new Error(`Runner "${benchmarkRunner}" does not expose a constructor.`);
    }

    const benchmarkBundle = { benchmarkName, benchmarkEntry, benchmarkFolder, benchmarkSignature };
    const results: any = await runner.run(benchmarkBundle, projectConfig, globalConfig, runnerLogStream);

    results.benchmarkSignature = benchmarkSignature;
    results.benchmarkName = benchmarkName;
    results.benchmarkEntry = benchmarkEntry;
    results.projectConfig = projectConfig;

    return results;
}
