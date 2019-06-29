import BenchmarkJob from "./BenchmarkJob";
import { EventEmitter} from "events";
import socketIO from "socket.io-client";
// @todo: use this indirectly... make an abstraction for the runner in agent
import SocketIOFile from "@best/runner-remote/build/file-uploader";
import { BenchmarkResultsSnapshot, BenchmarkResultsState, BenchmarkRuntimeConfig } from "@best/types";
import { loadBenchmarkJob } from "./benchmark-loader";

export interface AgentConfig {
    host: string,
    options: {
        path: string
    },
    spec: {
        browser: string,
        version: string,
    }
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

    constructor(config: AgentConfig) {
        super();
        this._config = config;
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
            this.emit('status-changed', {
                oldValue,
                newValue: value
            })
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
            job.socketConnection.emit('benchmark_error', job.jobId, err);
            this.status = AgentStatus.Idle;
            return ;
        }

        // eventually this can become a runner...
        this.proxifyJob(job)
            .then(() => {
                // @todo: move to success queue
                this.status = AgentStatus.Idle;
            })
            .catch(() => {
                // @todo: move to failures queue
                this.status = AgentStatus.Idle;
            });
    }

    canRunJob(job: BenchmarkJob): boolean {
        const jobRunnerConfig = job.projectConfig.benchmarkRunnerConfig;
        const jobSpec = jobRunnerConfig.spec || {};
        const jobHasSameSpec = jobSpec.browser == this._config.spec.browser &&
            jobSpec.version === this._config.spec.version;

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
            { host: this._config.host, options: this._config.options }
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
            const socket = socketIO(self._config.host, self._config.options);
            let resolved: boolean = false;

            job.socketConnection.on('disconnect', () => {
                resolved = true;
                socket.disconnect();
                reject(new Error('Connection terminated'));
            });

            socket.on('connect_error', function() {
                console.log("Connection error with hub: ", [self._config.host, self._config.options]);
                self.status = AgentStatus.Offline;
                // this is a special case that we need to handle with care, right now the job is scheduled to run in this hub
                // which is offline, but, is not the job fault, it can run in another agent. Note: can be solved if we add a new queue, and retry in another queue.
                reject(new Error('Agent running job became offline.'));
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

                socket.on('running_benchmark_start', () => {
                    job.socketConnection.emit('running_benchmark_start', job.jobId);
                });

                socket.on('running_benchmark_update', ({ state, opts }: { state: BenchmarkResultsState, opts: BenchmarkRuntimeConfig }) => {
                    job.socketConnection.emit('running_benchmark_update', job.jobId, { state, opts });
                });
                socket.on('running_benchmark_end', () => {
                    job.socketConnection.emit('running_benchmark_end', job.jobId);
                });

                socket.on('benchmark_enqueued', ({ pending }: { pending: number }) => {
                    job.socketConnection.emit('benchmark_enqueued', job.jobId, { pending });
                });

                // @todo: this should put the runner in a weird state and dont allow any new job until we can confirm the connection is valid.
                socket.on('disconnect', (reason: string) => {
                    if (!resolved) {
                        resolved = true;
                        const err = new Error(reason);
                        job.socketConnection.emit('benchmark_error', job.jobId, reason);
                        reject(err);
                    }
                });

                socket.on('error', (err: any) => {
                    resolved = true;
                    job.socketConnection.emit('benchmark_error', job.jobId, err instanceof Error ? err.message : err);
                    socket.disconnect();
                    reject(err);
                });

                socket.on('benchmark_error', (err: any) => {
                    resolved = true;
                    console.log(err);
                    job.socketConnection.emit('benchmark_error', job.jobId, err);
                    socket.disconnect();
                    reject(new Error('Benchmark couldn\'t finish running. '));
                });

                socket.on('benchmark_results', (result: BenchmarkResultsSnapshot) => {
                    resolved = true;
                    job.socketConnection.emit('benchmark_results', job.jobId, result);
                    socket.disconnect();
                    resolve(result);
                });

                socket.emit('benchmark_task', {
                    benchmarkName: job.benchmarkName,
                    benchmarkSignature: job.benchmarkSignature,
                    projectConfig: overriddenProjectConfig,
                    globalConfig: job.globalConfig,
                });
            });

            return true;
        });
    }
}
