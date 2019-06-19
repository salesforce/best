import { BuildConfig, BenchmarkInfo, BenchmarkResultsSnapshot } from "@best/types";
import { RunnerOutputStream } from "@best/console-stream";
import AbstractRunner from "@best/runner-abstract";

interface ConcreteRunner extends AbstractRunner {
    new(config?: any): ConcreteRunner;
}

export async function runBenchmark(benchmarkBuild: BuildConfig, runnerLogStream: RunnerOutputStream): Promise<BenchmarkResultsSnapshot> {
    const { benchmarkName, benchmarkEntry, benchmarkFolder, benchmarkSignature, projectConfig, globalConfig } = benchmarkBuild;
    const { benchmarkRunner } = projectConfig;
    let RunnerCtor: ConcreteRunner, runnerInstance: ConcreteRunner;

    try {
        const RunnerModule: any = require(benchmarkRunner);
        RunnerCtor = RunnerModule.Runner || RunnerModule.default || RunnerModule;
    } catch (e) {
        throw new Error(`Runner "${benchmarkRunner}" not found.`);
    }

    // Create a runner instance
    try {
        runnerInstance = new RunnerCtor(projectConfig.benchmarkRunnerConfig);
    } catch (e) {
        throw new Error(`Runner "${benchmarkRunner}" does not expose a constructor.`);
    }

    const benchmarkInfo: BenchmarkInfo = { benchmarkName, benchmarkEntry, benchmarkFolder, benchmarkSignature };
    return runnerInstance.run(benchmarkInfo, projectConfig, globalConfig, runnerLogStream);
}

export async function runBenchmarks(benchmarksBuilds: BuildConfig[], messager: RunnerOutputStream): Promise<BenchmarkResultsSnapshot[]> {
    const results = [];
    for (const benchmarkBuild of benchmarksBuilds) {
        const benchmarkResults = await runBenchmark(benchmarkBuild, messager);
        results.push(benchmarkResults);
    }

    return results;
}
