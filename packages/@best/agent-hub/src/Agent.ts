import socketIO from 'socket.io-client';
import { RemoteAgent } from "@best/runner-remote";
import BenchmarkJob from "./BenchmarkJob";
import {EventEmitter} from "events";

export interface AgentConfig {
    host: string,
    options: {
        path: string
    },
    remoteRunner: string,
    supportedBrowsers: string[]
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
            .finally(() => {
                this.status = AgentStatus.Idle;
            });
    }

    canRunJob(job: BenchmarkJob): boolean {
        // @todo: implement this: this should return true if the job can run in this agent, based on the job.config and this agent configuration.
        return true;
    }

    isIdle(): boolean {
        return this.status === AgentStatus.Idle;
    }

    private async proxifyJob(job: BenchmarkJob) {
        return new Promise(async (resolve, reject) => {
            const socket: SocketIOClient.Socket = socketIO(this._config.host, this._config.options);

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
                    if (reason === 'io server disconnect') {
                        job.socketConnection.emit('error', new Error('Connection terminated'));
                        reject(new Error('Connection terminated'));
                    }
                });


                remoteAgent.on('error', (err: any) => {
                    job.socketConnection.emit('error', err);
                    socket.disconnect();
                    reject(err);
                });

                remoteAgent.on('benchmark_error', (err: any) => {
                    job.socketConnection.emit('benchmark_error', err);
                    socket.disconnect();
                    reject(new Error('Benchmark couldn\'t finish running. '));
                });

                remoteAgent.on('benchmark_results', ({ results, environment }: any) => {
                    socket.disconnect();
                    job.socketConnection.emit('benchmark_results', { results, environment });
                    resolve({ results, environment });
                });

                remoteAgent.runBenchmark({
                    tarBundle: job.tarBundle,
                    benchmarkName: job.benchmarkName,
                    benchmarkSignature: job.benchmarkSignature,
                    projectConfig: job.projectConfig,
                    globalConfig: job.globalConfig,
                });
            });

            return true;
        });
    }
}
