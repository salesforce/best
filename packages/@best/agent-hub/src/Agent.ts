import socketIO from 'socket.io-client';
import { RemoteAgent } from "@best/runner-remote";
import BenchmarkJob from "./BenchmarkJob";
import {EventEmitter} from "events";

export interface AgentConfig {
    category: string,
    host: string,
    options: {
        path: string
    },
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

    set status(value: AgentStatus) {
        if (value !== this._status) {
            const oldValue = this._status;
            this._status = value;
            this.emit('statuschanged', {
                oldValue,
                newValue: value
            })
        }
    }

    runJob(job: BenchmarkJob) {
        if (this.status !== AgentStatus.Idle) {
            throw new Error("Can't run job in a busy agent");
        }
        this.status = AgentStatus.RunningJob;

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
        return job.projectConfig.benchmarkRunner === this._config.category &&
            this.status !== AgentStatus.Offline;
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
            const socket: SocketIOClient.Socket = socketIO(this._config.host, this._config.options);
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
                const remoteAgent: RemoteAgent = new RemoteAgent(socket);

                remoteAgent.on('running_benchmark_start', (benchName: string, projectName: string) => {
                    job.socketConnection.emit('running_benchmark_start', benchName, projectName);
                });

                remoteAgent.on('running_benchmark_update', ({ state, opts }: any) => {
                    job.socketConnection.emit('running_benchmark_update', { state, opts });
                });
                remoteAgent.on('running_benchmark_end', (benchName: string, projectName: string) => {
                    job.socketConnection.emit('running_benchmark_end', benchName, projectName);

                });

                // @todo: this should put the runner in a weird state and dont allow any new job until we can confirm the connection is valid.
                socket.on('disconnect', (reason: string) => {
                    if (!resolved) {
                        resolved = true;
                        const err = new Error(reason);
                        job.socketConnection.emit('benchmark_error', reason);
                        reject(err);
                    }
                });


                remoteAgent.on('error', (err: any) => {
                    job.socketConnection.emit('benchmark_error', err instanceof Error ? err.message : err);
                    socket.disconnect();
                    reject(err);
                });

                remoteAgent.on('benchmark_error', (err: any) => {
                    resolved = true;
                    job.socketConnection.emit('benchmark_error', err instanceof Error ? err.message : err);
                    socket.disconnect();
                    reject(new Error('Benchmark couldn\'t finish running. '));
                });

                remoteAgent.on('benchmark_results', ({ results, environment }: any) => {
                    resolved = true;
                    socket.disconnect();
                    job.socketConnection.emit('benchmark_results', { results, environment });
                    resolve({ results, environment });
                });

                remoteAgent.runBenchmark({
                    tarBundle: job.tarBundle,
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
