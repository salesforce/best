import path from "path";
import fs from "fs";
import {
    BenchmarkInfo,
    BenchmarkResultsSnapshot,
    BenchmarkResultsState, BenchmarkRuntimeConfig,
    FrozenGlobalConfig,
    FrozenProjectConfig
} from "@best/types";
import { RunnerOutputStream } from "@best/console-stream";
import { createTarBundle } from "./create-tar";
import {createHubSocket, HubSocket} from "./HubSocket";

function proxifyRunner(benchmarkEntryBundle: BenchmarkInfo, projectConfig: FrozenProjectConfig, globalConfig: FrozenGlobalConfig, messager: RunnerOutputStream) : Promise<BenchmarkResultsSnapshot> {
    return new Promise(async (resolve, reject) => {
        const { benchmarkName, benchmarkEntry, benchmarkSignature } = benchmarkEntryBundle;
        const { host, options, remoteRunner } = projectConfig.benchmarkRunnerConfig;
        const bundleDirname = path.dirname(benchmarkEntry);

        // @todo: not needed since the hub will already have a config.
        // @todo: add specs here in the runner config.
        const remoteProjectConfig = Object.assign({}, projectConfig, {
            benchmarkRunner: remoteRunner,
        });
        const tarBundle = path.resolve(bundleDirname, `${benchmarkName}.tgz`);

        await createTarBundle(bundleDirname, benchmarkName);

        if (!fs.existsSync(tarBundle)) {
            return reject(new Error('Benchmark artifact not found (${tarBundle})'));
        }

        // we need the socket dance here...
        let hubSocket: HubSocket;
        try {
            hubSocket = await createHubSocket(host, options);
        } catch (err) {
            console.log(err);
            reject(new Error("Couldn't connect to agent hub"));
            return;
        }

        hubSocket.on('running_benchmark_start', () => {
            messager.log(`Running benchmarks remotely...`);
            messager.onBenchmarkStart(benchmarkEntry);
        });

        hubSocket.on('running_benchmark_update', (state: BenchmarkResultsState, opts: BenchmarkRuntimeConfig) => {
            messager.updateBenchmarkProgress(state, opts);
        });
        hubSocket.on('running_benchmark_end', () => {
            messager.onBenchmarkEnd(benchmarkEntry);
        });

        hubSocket.on('benchmark_enqueued', (pending: number) => {
            messager.log(`Queued in agent. Pending tasks: ${pending}`);
        });

        hubSocket.on('disconnect', (reason: string) => {
            if (reason === 'io server disconnect') {
                reject(new Error('Connection terminated'));
            }
        });

        hubSocket.on('error', (err: any) => {
            console.log('Error in connection to agent > ', err);
            reject(err);
        });

        hubSocket.on('benchmark_error', (err: any) => {
            hubSocket.disconnect();
            console.log(err);
            reject(new Error('Benchmark couldn\'t finish running. '));
        });

        hubSocket.on('benchmark_results', (result: BenchmarkResultsSnapshot) => {
            hubSocket.disconnect();
            resolve(result);
        });

        hubSocket.runBenchmark({
            benchmarkName,
            benchmarkSignature,
            tarBundle,
            projectConfig: remoteProjectConfig,
            globalConfig,
        });

        return true;
    });
}

export class Runner {
    run(benchmarkInfo: BenchmarkInfo, projectConfig: FrozenProjectConfig, globalConfig: FrozenGlobalConfig, runnerLogStream: RunnerOutputStream): Promise<BenchmarkResultsSnapshot> {
        return proxifyRunner(benchmarkInfo, projectConfig, globalConfig, runnerLogStream);
    }
}
