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
import {createHubSocket} from "./HubSocket";

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
        const socket = await createHubSocket(host, options); // socketIO(host, options);

        // socket.on('connect', () => {
        //     socket.on('load_benchmark', () => {
        //         const uploader = new SocketIOFile(socket);
        //         uploader.on('ready', () => {
        //             uploader.upload(tarBundle);
        //         });
        //
        //         uploader.on('error', (err) => {
        //             reject(err);
        //         });
        //     });

            socket.on('running_benchmark_start', () => {
                messager.log(`Running benchmarks remotely...`);
                messager.onBenchmarkStart(benchmarkEntry);
            });

            socket.on('running_benchmark_update', (state: BenchmarkResultsState, opts: BenchmarkRuntimeConfig) => {
                messager.updateBenchmarkProgress(state, opts);
            });
            socket.on('running_benchmark_end', () => {
                messager.onBenchmarkEnd(benchmarkEntry);
            });

            socket.on('benchmark_enqueued', (pending: number) => {
                messager.log(`Queued in agent. Pending tasks: ${pending}`);
            });

            socket.on('disconnect', (reason: string) => {
                if (reason === 'io server disconnect') {
                    reject(new Error('Connection terminated'));
                }
            });

            socket.on('error', (err: any) => {
                console.log('Error in connection to agent > ', err);
                reject(err);
            });

            socket.on('benchmark_error', (err: any) => {
                console.log(err);
                reject(new Error('Benchmark couldn\'t finish running. '));
            });

            socket.on('benchmark_results', (result: BenchmarkResultsSnapshot) => {
                socket.disconnect();
                resolve(result);
            });

            socket.runBenchmark({
                benchmarkName,
                benchmarkSignature,
                tarBundle,
                projectConfig: remoteProjectConfig,
                globalConfig,
            });

            // socket.emit('benchmark_task', {
            //     benchmarkName,
            //     benchmarkSignature,
            //     tarBundle,
            //     projectConfig: remoteProjectConfig,
            //     globalConfig,
            // });
        // });

        return true;
    });
}

export class Runner {
    run(benchmarkInfo: BenchmarkInfo, projectConfig: FrozenProjectConfig, globalConfig: FrozenGlobalConfig, runnerLogStream: RunnerOutputStream): Promise<BenchmarkResultsSnapshot> {
        return proxifyRunner(benchmarkInfo, projectConfig, globalConfig, runnerLogStream);
    }
}
