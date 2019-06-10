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
    RunningJob
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
                this.status = AgentStatus.Idle;
                // this agent needs to go and pick up the next job.
            })
            .catch(() => {
                // this agent needs to go and pick up the next job.
                this.status = AgentStatus.Idle;
            });
    }

    canRunJob(job: BenchmarkJob): boolean {
        return true;
    }

    isIdle(): boolean {
        return this.status === AgentStatus.Idle;
    }

    private async proxifyJob(job: BenchmarkJob) {
        const agent = this;
        return new Promise(async (resolve, reject) => {
            const socket: SocketIOClient.Socket = socketIO(this._config.host, this._config.options);

            socket.on('connect', () => {
                const remoteAgent: RemoteAgent = new RemoteAgent(socket);

                remoteAgent.on('running_benchmark_start', (benchName: string, projectName: string) => {
                    job.socketConnection.emit('running_benchmark_start', job.jobId, benchName, projectName);
                });

                remoteAgent.on('running_benchmark_update', ({ state, opts }: any) => {
                    job.socketConnection.emit('running_benchmark_update', job.jobId, { state, opts });
                });
                remoteAgent.on('running_benchmark_end', (benchName: string, projectName: string) => {
                    job.socketConnection.emit('running_benchmark_end', job.jobId, benchName, projectName);

                });

                // this should not happen at this level, this should be handled at the job queue level.
                // remoteAgent.on('benchmark_enqueued', ({ pending }: any) => {
                //     messager.logState(`Queued in agent. Pending tasks: ${pending}`);
                // });

                socket.on('disconnect', (reason: string) => {
                    if (reason === 'io server disconnect') {
                        agent.status = AgentStatus.Idle;
                        job.socketConnection.emit('error', job.jobId, new Error('Connection terminated'));
                        reject(new Error('Connection terminated'));
                    }
                });


                remoteAgent.on('error', (err: any) => {
                    agent.status = AgentStatus.Idle;
                    job.socketConnection.emit('error', job.jobId, err);
                    socket.disconnect();
                    reject(err);
                });

                remoteAgent.on('benchmark_error', (err: any) => {
                    job.socketConnection.emit('benchmark_error', job.jobId, err);
                    agent.status = AgentStatus.Idle;
                    socket.disconnect();
                    reject(new Error('Benchmark couldn\'t finish running. '));
                });

                remoteAgent.on('benchmark_results', ({ results, environment }: any) => {
                    agent.status = AgentStatus.Idle;
                    socket.disconnect();
                    job.socketConnection.emit('benchmark_results', job.jobId, { results, environment });
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
