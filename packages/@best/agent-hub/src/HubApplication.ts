import * as SocketIO from "socket.io";
import ObservableQueue from "./utils/ObservableQueue";
import BenchmarkJob from "./BenchmarkJob";
import { AgentManager } from "./AgentManager";
import { Agent } from "./Agent";
import { loadBenchmarkJob } from "./benchmark-loader";

export class HubApplication {
    private _incomingQueue: ObservableQueue<BenchmarkJob>;
    private _readyQueue: ObservableQueue<BenchmarkJob>;
    private _agentManager: AgentManager;

    constructor(incomingQueue: ObservableQueue<BenchmarkJob>, readyQueue: ObservableQueue<BenchmarkJob>, agentManager: AgentManager) {
        this._incomingQueue = incomingQueue;
        this._readyQueue = readyQueue;
        this._agentManager = agentManager;

        this.attachEventListeners();
    }

    handleIncomingSocketConnection = (socket: SocketIO.Socket) => {
        // @todo: define the types for the data.
        // @todo: add timeout on waiting the benchmark task?
        socket.on('benchmark_task', (data: any) => {
            const job = new BenchmarkJob({
                ...data,
                socket
            });

            if (this._agentManager.existAgentForJob(job)) {
                socket.on('disconnect', () => {
                    this._incomingQueue.remove(job);
                    this._readyQueue.remove(job);
                });

                this._incomingQueue.push(job);
            } else {
                // there is no agent to run this job
                socket.emit('benchmark_error', 'There is no agent in the hub to run this job.');
                socket.disconnect(true);
            }
        });
    };

    private attachEventListeners() {
        // @todo: rename the event to match each other
        this._agentManager.on('idleagent', this.handleIdleAgent);
        this._incomingQueue.on('item-added', this.handleIncomingJob);
        this._readyQueue.on('item-added', this.handleJobReadyToRun);
    }

    private handleJobReadyToRun = (job: BenchmarkJob) => {
        const agent: Agent | null = this._agentManager.getIdleAgentForJob(job);

        if (agent !== null) {
            this._readyQueue.remove(job);
            agent.runJob(job);
        } else {
            job.socketConnection.emit('benchmark_enqueued', {pending: this._readyQueue.size - 1});
        }
    };

    private handleIdleAgent = (agent: Agent) => {
        for (const job of this._readyQueue) {
            if (agent.canRunJob(job!)) {
                this._readyQueue.remove(job!);
                agent.runJob(job!);
                break;
            }
        }
    };

    private handleIncomingJob = (job: BenchmarkJob) => {
        loadBenchmarkJob(job)
            .then((resolvedJob: BenchmarkJob) => {
                this._incomingQueue.remove(resolvedJob);
                this._readyQueue.push(resolvedJob);
            })
            .catch((err: any) => {
                this._incomingQueue.remove(job);
                // @todo: move to the error queue for accounting process.
                console.log(`Error while processing job with signature: "${job.benchmarkSignature}"`, err);
            });
    };
}
