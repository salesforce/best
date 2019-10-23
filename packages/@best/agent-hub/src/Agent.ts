/*
 * Copyright (c) 2019, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: MIT
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/MIT
*/

import BenchmarkJob from "./BenchmarkJob";
import { EventEmitter} from "events";
import socketIO from "socket.io-client";
// @todo: use this indirectly... make an abstraction for the runner in agent
import SocketIOFile from "@best/runner-remote/build/file-uploader";
import { BenchmarkResultsSnapshot, BenchmarkResultsState, BenchmarkRuntimeConfig } from "@best/types";
import { loadBenchmarkJob } from "./benchmark-loader";
import AgentLogger, { loggedSocket } from '@best/agent-logger';
import { proxifiedSocketOptions } from '@best/utils';

const AGENT_CONNECTION_ERROR = 'Agent running job became offline.';

export interface Spec {
    browser: string,
    version: string,
}

export interface AgentConfig {
    host: string,
    options: {
        path: string
        proxy?: string
    },
    specs: Spec[],
    remoteRunner: string,
    remoteRunnerConfig?: object
}

export enum AgentStatus {
    Idle = 1,
    RunningJob,
    Offline
}

export class Agent extends EventEmitter {
    private _status: AgentStatus = AgentStatus.Idle;
    private _config: AgentConfig;
    private _logger: AgentLogger;

    constructor(config: AgentConfig, logger: AgentLogger) {
        super();
        this._config = config;
        this._logger = logger.withAgentId(this.host);
    }

    get status() {
        return this._status;
    }

    get host() {
        return this._config.host;
    }

    set status(value: AgentStatus) {
        if (value !== this._status) {
            const oldValue = this._status;
            this._status = value;
            const packet = {
                oldValue,
                newValue: value
            }
            this.emit('status-changed', packet);
            this._logger.event("AgentManager", "AGENT_STATUS_CHANGED", packet);
        }
    }

    async runJob(job: BenchmarkJob) {
        if (this.status !== AgentStatus.Idle) {
            throw new Error("Can't run job in a busy agent");
        }
        this.status = AgentStatus.RunningJob;

        // load the tar file...
        try {
            await loadBenchmarkJob(job);
        } catch (err) {
            console.log('Error while uploading file to the hub', err);
            this._logger.event(job.socketConnection.id, 'benchmark error', err, false);
            job.socketConnection.emit('benchmark_error', err);
            this.status = AgentStatus.Idle;
            return ;
        }

        // eventually this can become a runner...
        this.proxifyJob(job)
            .then(() => {
                // @todo: move to success queue
                this.status = AgentStatus.Idle;
            })
            .catch((err) => {
                // @todo: move to failures queue
                if (err.message === AGENT_CONNECTION_ERROR) {
                    this.status = AgentStatus.Offline;
                    // TODO: in this case, we need to re-run the job on a different agent (if we have one)
                } else {
                    this.status = AgentStatus.Idle;
                }
            });
    }

    canRunJob(spec: Spec): boolean {
        const specs = this._config.specs;
        const jobHasSameSpec = specs.some(({ browser, version }) => {
            return browser === spec.browser && version === spec.version
        });

        return jobHasSameSpec && this.status !== AgentStatus.Offline;
    }

    isIdle(): boolean {
        return this.status === AgentStatus.Idle;
    }

    private async proxifyJob(job: BenchmarkJob) {
        const self = this;
        const remoteAgentRunnerConfig = Object.assign(
            {},
            this._config.remoteRunnerConfig,
            { host: this._config.host,
                options: this._config.options,
                webdriverOptions: job.projectConfig.benchmarkRunnerConfig.webdriverOptions }
        );

        const overriddenProjectConfig = Object.assign(
            {},
            job.projectConfig,
            {
                benchmarkRunner: this._config.remoteRunner,
                benchmarkRunnerConfig: remoteAgentRunnerConfig,
            }
        );

        return new Promise(async (resolve, reject) => {
            const socket = socketIO(self._config.host, proxifiedSocketOptions(self._config.options));
            const jobSocket = loggedSocket(job.socketConnection, this._logger);
            let resolved: boolean = false;

            job.socketConnection.on('disconnect', () => {
                if (!resolved) { // it is not yet resolved then the job has been cancelled
                    this._logger.event(job.socketConnection.id, 'benchmark cancel');
                }

                resolved = true;
                socket.disconnect();
                reject(new Error('Connection terminated'));
            });

            socket.on('connect_error', (err: any) => {
                console.log("Connection error with hub: ", [self._config.host, self._config.options]);
                console.log(err)
                self.status = AgentStatus.Offline;
                // this is a special case that we need to handle with care, right now the job is scheduled to run in this hub
                // which is offline, but, is not the job fault, it can run in another agent. Note: can be solved if we add a new queue, and retry in another queue.
                resolved = true;
                socket.disconnect();
                jobSocket.emit('benchmark_error', 'Error connecting to agent');
                reject(new Error(AGENT_CONNECTION_ERROR));
                // @todo: add a retry logic?
            });

            socket.on('connect', () => {
                socket.on('load_benchmark', () => {
                    const uploader = new SocketIOFile(socket);
                    uploader.on('ready', () => {
                        uploader.upload(job.tarBundle);
                    });

                    uploader.on('error', (err) => {
                        reject(err);
                    });
                });

                socket.on('running_benchmark_start', ({ entry }: { entry: string }) => {
                    jobSocket.emit('running_benchmark_start', { entry });
                });

                socket.on('running_benchmark_update', ({ state, opts }: { state: BenchmarkResultsState, opts: BenchmarkRuntimeConfig }) => {
                    jobSocket.emit('running_benchmark_update', { state, opts });
                });

                socket.on('running_benchmark_end', ({ entry }: { entry: string }) => {
                    jobSocket.emit('running_benchmark_end', { entry });
                });

                socket.on('benchmark_enqueued', ({ pending }: { pending: number }) => {
                    jobSocket.emit('benchmark_enqueued', { pending });
                });

                // @todo: this should put the runner in a weird state and dont allow any new job until we can confirm the connection is valid.
                socket.on('disconnect', (reason: string) => {
                    if (!resolved) {
                        resolved = true;
                        const err = new Error(reason);
                        jobSocket.emit('benchmark_error', reason);
                        reject(err);
                    }
                });

                socket.on('error', (err: any) => {
                    resolved = true;
                    const reason = err instanceof Error ? err.message : err
                    jobSocket.emit('benchmark_error', reason);
                    socket.disconnect();
                    reject(err);
                });

                socket.on('benchmark_error', (err: any) => {
                    resolved = true;
                    this._logger.error(job.socketConnection.id, 'benchmark_error', err);
                    jobSocket.emit('benchmark_error', err);
                    socket.disconnect();
                    reject(new Error('Benchmark couldn\'t finish running. '));
                });

                socket.on('benchmark_results', (result: BenchmarkResultsSnapshot) => {
                    resolved = true;
                    jobSocket.emit('benchmark_results', result);
                    socket.disconnect();
                    resolve(result);
                });

                socket.emit('benchmark_task', {
                    benchmarkName: job.benchmarkName,
                    benchmarkFolder: job.benchmarkFolder,
                    benchmarkSignature: job.benchmarkSignature,
                    projectConfig: overriddenProjectConfig,
                    globalConfig: job.globalConfig,
                });
            });

            return true;
        });
    }
}
