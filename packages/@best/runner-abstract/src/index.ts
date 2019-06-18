import { getSystemInfo } from '@best/utils';
import { RunnerOutputStream } from "@best/console-stream";
import { FrozenGlobalConfig, FrozenProjectConfig } from '@best/config';

export interface RunnerBundle {
    benchmarkName: string,
    benchmarkEntry: string,
    benchmarkFolder: string,
    benchmarkSignature: string
}

export interface RuntimeOptions {
    maxDuration: number;
    minSampleCount: number,
    iterations: number,
    iterateOnClient: boolean
}

export interface BenchmarkResultsState {
    executedTime: number,
    executedIterations: number,
    results: any[],
    iterateOnClient: boolean,
}

export interface BenchmarkResults {

}

export default abstract class AbstractRunner {
    abstract async run({ benchmarkEntry }: RunnerBundle, projectConfig: FrozenProjectConfig, globalConfig: FrozenGlobalConfig, runnerLogStream: RunnerOutputStream): Promise<BenchmarkResults>;

    getRuntimeOptions(projectConfig: FrozenProjectConfig): RuntimeOptions {
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
