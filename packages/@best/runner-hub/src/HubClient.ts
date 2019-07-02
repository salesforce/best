import {
    BenchmarkInfo,
    BenchmarkResultsSnapshot,
    BenchmarkResultsState,
    BenchmarkRuntimeConfig,
    FrozenGlobalConfig,
    FrozenProjectConfig
} from "@best/types";
import { RunnerOutputStream } from "@best/console-stream";
import socketIO from "socket.io-client";
import path from "path";
import {createTarBundle} from "./create-tar";
import fs from "fs";
import {createHubSocket, HubSocket} from "./HubSocket";

interface HubRun {
    cancelRun: Function;
    result: Promise<BenchmarkResultsSnapshot>
}

function proxifyRunner(benchmarkEntryBundle: BenchmarkInfo, projectConfig: FrozenProjectConfig, globalConfig: FrozenGlobalConfig, messager: RunnerOutputStream) : HubRun {
    let cancelledRun = false;
    let hubConnection: HubSocket | null = null;
    const cancelRun = () => {
        if (hubConnection === null) {
            cancelledRun = true;
        } else {
            hubConnection.disconnect();
        }
    };

    const result: Promise<BenchmarkResultsSnapshot> = new Promise(async (resolve, reject) => {
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

        if (cancelledRun) {
            hubSocket.disconnect();
            reject();
            return ;
        }

        hubConnection = hubSocket;

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

    return {
        cancelRun,
        result
    }
}

export class HubClient {
    async runBenchmarks(benchmarksBuilds: BenchmarkInfo[], projectConfig: FrozenProjectConfig, globalConfig: FrozenGlobalConfig, messager: RunnerOutputStream): Promise<BenchmarkResultsSnapshot[]> {
        let resolved = false;

        return new Promise(async (resolve, reject) => {
            let currentJob = 0;
            const { host, options, spec } = projectConfig.benchmarkRunnerConfig;
            const jobs = benchmarksBuilds;
            const jobResults: Promise<BenchmarkResultsSnapshot>[] = [];
            const jobRuns: HubRun[] = [];

            const socket = socketIO(host, options);

            socket.on('connect', () => {
                socket.on('disconnect', (reason: string) => {
                    if (!resolved) {
                        resolved = true;
                        reject(new Error('Connection terminated'));
                    }
                });

                socket.on('error', (err: any) => {
                    console.log('Error in connection to agent > ', err);
                    resolved = true;
                    reject(err);
                });

                socket.on('hub-cancel', (reason: string) => {
                    resolved = false;
                    reject(new Error(reason));
                    socket.disconnect();
                });

                socket.on('new-job', () => {
                    if (currentJob < jobs.length) {
                        const jobInQueue = jobs[currentJob++];
                        const jobRun = proxifyRunner(jobInQueue, projectConfig, globalConfig, messager);
                        jobRuns.push(jobRun);
                        jobResults.push(jobRun.result);

                        jobRun.result
                            .catch((reason => {
                                if (!resolved) {
                                    resolved = true;
                                    for (let i = currentJob - 1; i > 0; i--) {
                                        jobRuns[i].cancelRun();
                                    }
                                    socket.disconnect();
                                    reject(reason);
                                }
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
                                    for (let i = currentJob - 1; i > 0; i--) {
                                        jobRuns[i].cancelRun();
                                    }
                                    socket.disconnect();
                                    reject(reason);
                                });
                        }
                    }
                });

                socket.emit('connect-client', spec, jobs.length);
            });
        });
    }
}
