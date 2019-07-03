import {
    BenchmarkInfo,
    BenchmarkResultsSnapshot,
    BuildConfig,
    FrozenGlobalConfig,
    FrozenProjectConfig
} from "@best/types";
import { RunnerOutputStream } from "@best/console-stream";
import AbstractRunner from "@best/runner-abstract";
import { HubClient } from "./HubClient";

export class Runner extends AbstractRunner {
    async run(benchmarkInfo: BenchmarkInfo, projectConfig: FrozenProjectConfig, globalConfig: FrozenGlobalConfig, runnerLogStream: RunnerOutputStream): Promise<BenchmarkResultsSnapshot> {
        const client = new HubClient();
        const results = await client.runBenchmarks([benchmarkInfo], projectConfig, globalConfig, runnerLogStream);

        return results[0];
    }

    async runBenchmarksInBatch(benchmarksBuilds: BuildConfig[], messager: RunnerOutputStream): Promise<BenchmarkResultsSnapshot[]> {
        const { projectConfig, globalConfig } = benchmarksBuilds[0];
        const client = new HubClient();

        return client.runBenchmarks(benchmarksBuilds, projectConfig, globalConfig, messager);
    }
}
