import path from "path";
import fs from "fs";
import {
    BenchmarkInfo,
    BenchmarkResultsSnapshot,
    BenchmarkResultsState, BenchmarkRuntimeConfig, BuildConfig,
    FrozenGlobalConfig,
    FrozenProjectConfig
} from "@best/types";
import { RunnerOutputStream } from "@best/console-stream";
import { createTarBundle } from "./create-tar";
import {createHubSocket, HubSocket} from "./HubSocket";
import AbstractRunner from "@best/runner-abstract";
import socketIO from "socket.io-client";

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

export class Runner extends AbstractRunner {
    run(benchmarkInfo: BenchmarkInfo, projectConfig: FrozenProjectConfig, globalConfig: FrozenGlobalConfig, runnerLogStream: RunnerOutputStream): Promise<BenchmarkResultsSnapshot> {
        return proxifyRunner(benchmarkInfo, projectConfig, globalConfig, runnerLogStream);
    }

    async runBenchmarksInBatch(benchmarksBuilds: BuildConfig[], messager: RunnerOutputStream): Promise<BenchmarkResultsSnapshot[]> {
        let resolved = false;
        const { projectConfig } = benchmarksBuilds[0];
        const { host, options, spec } = projectConfig.benchmarkRunnerConfig;

        return new Promise(async (resolve, reject) => {
            let currentJob = 0;
            const jobs = benchmarksBuilds.map((build) => {
                const { benchmarkName, benchmarkEntry, benchmarkFolder, benchmarkSignature, projectConfig, globalConfig } = build;
                const benchmarkInfo: BenchmarkInfo = { benchmarkName, benchmarkEntry, benchmarkFolder, benchmarkSignature };

                return { benchmarkInfo, projectConfig, globalConfig };
            });

            const jobResults: Promise<BenchmarkResultsSnapshot>[] = [];

            const socket = socketIO(host, options);

            socket.on('connect', () => {
                socket.on('disconnect', (reason: string) => {
                    if (!resolved) {
                        // if (reason === 'io server disconnect') {
                            reject(new Error('Connection terminated'));
                        // }
                    }
                });

                socket.on('error', (err: any) => {
                    console.log('Error in connection to agent > ', err);
                    reject(err);
                });

                socket.emit('connect-client', spec, jobs.length);

                socket.on('new-job', () => {
                    if (currentJob < jobs.length) {
                        // @todo: lets go for the happy path, but if this fails, then we need to cancel other requests
                        const jobInQueue = jobs[currentJob++];
                        const jobRun = this.run(jobInQueue.benchmarkInfo, jobInQueue.projectConfig, jobInQueue.globalConfig, messager);
                        jobResults.push(jobRun);

                        jobRun
                            .catch((reason => {
                                resolved = true;
                                socket.disconnect();
                                reject(reason);
                            }));

                        if (currentJob === jobs.length) {
                            Promise.all(jobResults)
                                .then((results) => {
                                    resolved = true;
                                    console.log('disconnecting client');
                                    socket.disconnect();
                                    resolve(results);
                                })
                                .catch((reason) => {
                                    resolved = true;
                                    socket.disconnect();
                                    reject(reason);
                                });
                        }
                    }
                });
            });
        });
        // const promises = benchmarksBuilds.map((build: BuildConfig) => {
        //     return this.run(build, build.projectConfig, build.globalConfig, messager);
        // });
        //
        // return await Promise.all(promises);
    }
}
