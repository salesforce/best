import { getSystemInfo } from '@best/utils';
import { RunnerOutputStream } from "@best/console-stream";
import { FrozenGlobalConfig, FrozenProjectConfig, BenchmarkInfo, BenchmarkRuntimeConfig } from '@best/types';

export interface BenchmarkResultsState {
    executedTime: number,
    executedIterations: number,
    results: any[],
    iterateOnClient: boolean,
}

export interface BenchmarkResults {}

export default abstract class AbstractRunner {
    abstract async run({ benchmarkEntry }: BenchmarkInfo, projectConfig: FrozenProjectConfig, globalConfig: FrozenGlobalConfig, runnerLogStream: RunnerOutputStream): Promise<BenchmarkResults>;

    getRuntimeOptions(projectConfig: FrozenProjectConfig): BenchmarkRuntimeConfig {
        const { benchmarkIterations, benchmarkOnClient, benchmarkMaxDuration, benchmarkMinIterations } = projectConfig;
        const definedIterations = Number.isInteger(benchmarkIterations);

        // For benchmarking on the client or a defined number of iterations duration is irrelevant
        const maxDuration = definedIterations ? 1 : benchmarkMaxDuration;
        const minSampleCount = definedIterations ? benchmarkIterations : benchmarkMinIterations;

        return {
            maxDuration,
            minSampleCount,
            iterations: benchmarkIterations,
            iterateOnClient: benchmarkOnClient,
        };
    }

    async getHardwareSpec() {
        const { system, cpu, os, load } = await getSystemInfo();
        return {
            hardware: { system, cpu, os },
            container: { load }
        }
    }
}
