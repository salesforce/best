import fs from "fs";
import path from "path";
import socketIO from "socket.io-client";
import {
    BenchmarkInfo,
    BenchmarkResultsSnapshot,
    BenchmarkResultsState,
    BenchmarkRuntimeConfig,
    FrozenGlobalConfig,
    FrozenProjectConfig
} from "@best/types";
import { RunnerOutputStream } from "@best/console-stream";
import { createTarBundle } from "./create-tar";
import SocketIOFile from "./file-uploader";
import { proxifiedOptions } from './utils/proxy';

interface HubRun {
    cancelRun: Function;
    result: Promise<BenchmarkResultsSnapshot>
}

function proxifyRunner(benchmarkEntryBundle: BenchmarkInfo, projectConfig: FrozenProjectConfig, globalConfig: FrozenGlobalConfig, messager: RunnerOutputStream) : HubRun {
    let cancelledRun = false;
    let hubConnection: SocketIOClient.Socket | null = null;
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

        const remoteProjectConfig = Object.assign({}, projectConfig, {
            benchmarkRunner: remoteRunner,
        });
        const tarBundle = path.resolve(bundleDirname, `${benchmarkName}.tgz`);

        await createTarBundle(bundleDirname, benchmarkName);

        if (!fs.existsSync(tarBundle)) {
            return reject(new Error(`Benchmark artifact not found (${tarBundle})`));
        }

        const normalizedSocketOptions = {
            path: '/best',
            ...options
        }

        const socket = socketIO(host, proxifiedOptions(normalizedSocketOptions));

        socket.on('connect_error', (err: any) => {
            console.log('Error in connection to agent > ', err);
            reject(err);
        })

        socket.on('connect', () => {
            if (cancelledRun) {
                socket.disconnect();
                reject();
                return ;
            }
            hubConnection = socket;

            socket.on('load_benchmark', () => {
                const uploader = new SocketIOFile(socket);
                uploader.on('ready', () => {
                    uploader.upload(tarBundle);
                });

                uploader.on('error', (err) => {
                    reject(err);
                });
            });

            socket.on('running_benchmark_start', () => {
                messager.log(`Running benchmarks remotely...`);
                messager.onBenchmarkStart(benchmarkEntry);
            });

            socket.on('running_benchmark_update', ({ state, opts }: { state: BenchmarkResultsState, opts: BenchmarkRuntimeConfig }) => {
                messager.updateBenchmarkProgress(state, opts);
            });
            socket.on('running_benchmark_end', () => {
                messager.onBenchmarkEnd(benchmarkEntry);
            });

            socket.on('benchmark_enqueued', ({ pending }: { pending: number }) => {
                messager.log(`Queued in agent. Pending tasks: ${pending}`);
            });

            socket.on('disconnect', (reason: string) => {
                if (reason === 'io server disconnect') {
                    reject(new Error('Connection terminated'));
                }
            });

            socket.on('benchmark_error', (err: any) => {
                console.log(err);
                reject(new Error('Benchmark couldn\'t finish running. '));
            });

            socket.on('benchmark_results', (result: BenchmarkResultsSnapshot) => {
                socket.disconnect();
                resolve(result);
            });

            socket.on('error', (err: any) => {
                console.log('Error in connection to agent > ', err);
                reject(err);
            });

            socket.emit('benchmark_task', {
                benchmarkName,
                benchmarkSignature,
                projectConfig: remoteProjectConfig,
                globalConfig,
            });
        });

        return true;
    });

    return {
        cancelRun,
        result
    }
}

function cancelRunningJobs(jobRuns: HubRun[]) {
    for (let i = jobRuns.length - 1; i > 0; i--) {
        jobRuns[i].cancelRun();
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

            const normalizedSocketOptions = {
                path: '/best',
                ...options
            }
    
            const socket = socketIO(host, proxifiedOptions(normalizedSocketOptions));

            socket.on('connect_error', (err: any) => {
                console.log('Error in connection to agent > ', err);
                resolved = true;
                reject(err);
            })

            socket.on('connect', () => {
                socket.on('error', (err: any) => {
                    console.log('Error in connection to agent > ', err);
                    resolved = true;
                    reject(err);
                });

                socket.on('disconnect', (reason: string) => {
                    if (!resolved) {
                        resolved = true;
                        reject(new Error('Connection terminated: ' + reason));
                    }
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
                                    cancelRunningJobs(jobRuns);
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
                                    cancelRunningJobs(jobRuns);
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
