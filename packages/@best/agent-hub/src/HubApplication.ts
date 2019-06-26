import * as SocketIO from "socket.io";
import ObservableQueue from "./utils/ObservableQueue";
import BenchmarkJob from "./BenchmarkJob";
import { AgentManager } from "./AgentManager";
import { Agent } from "./Agent";

export class HubApplication {
    private _incomingQueue: ObservableQueue<BenchmarkJob>;
    private _agentManager: AgentManager;

    constructor(incomingQueue: ObservableQueue<BenchmarkJob>, agentManager: AgentManager) {
        this._incomingQueue = incomingQueue;
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
                });

                this._incomingQueue.push(job);
            } else {
                // there is no agent to run this job
                socket.emit('benchmark_error', 'There is no agent in the hub that match the specs to run this job.');
                socket.disconnect(true);
            }
        });
    };

    private attachEventListeners() {
        // @todo: rename the event to match each other
        this._agentManager.on('idle-agent', this.handleIdleAgent);
        this._incomingQueue.on('item-added', this.handleJobReadyToRun);
    }

    private handleJobReadyToRun = (job: BenchmarkJob) => {
        const agent: Agent | null = this._agentManager.getIdleAgentForJob(job);

        if (agent !== null) {
            this._incomingQueue.remove(job);
            agent.runJob(job);
        } else {
            job.socketConnection.emit('benchmark_enqueued', job.jobId, { pending: this._incomingQueue.size });
        }
    };

    private handleIdleAgent = (agent: Agent) => {
        for (const job of this._incomingQueue) {
            if (agent.canRunJob(job!)) {
                this._incomingQueue.remove(job!);
                agent.runJob(job!);
                break;
            }
        }
    };
}
