import * as SocketIO from "socket.io";
import ObservableQueue from "./utils/ObservableQueue";
import BenchmarkJob from "./BenchmarkJob";
import { AgentManager } from "./AgentManager";
import {Agent, Spec} from "./Agent";
import {Client} from "./Client";

export class HubApplication {
    private _incomingQueue: ObservableQueue<BenchmarkJob>;
    private _agentManager: AgentManager;

    private assignedAgents: WeakMap<Agent, Client> = new WeakMap<Agent, Client>();
    private clientAgents: WeakMap<Client, Agent> = new WeakMap<Client, Agent>();
    private pendingClients: Client[] = [];
    private runningClients: Client[] = [];

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

            if (this._agentManager.existAgentWithSpec(job.spec)) {
                socket.on('disconnect', () => {
                    this._incomingQueue.remove(job);
                });

                this._incomingQueue.push(job);
            } else {
                // there is no agent to run this job
                socket.emit('benchmark_error', job.jobId, 'There is no agent in the hub that match the specs to run this job.');
                socket.disconnect(true);
            }
        });

        socket.on('connect-client', (spec: Spec, jobs: number) => {
            const client = new Client(socket, spec, jobs);

            if (!this._agentManager.existAgentWithSpec(spec)) {
                // there is no agent to run this job
                socket.emit('cancel', 'There is no agent in the hub that match the specs to run client benchmarks.');
                socket.disconnect(true);
            } else {
                socket.on('disconnect', () => {
                    if (this.clientAgents.has(client)) {
                        const assignedAgent = this.clientAgents.get(client)!;
                        this.assignedAgents.delete(assignedAgent);
                        this.clientAgents.delete(client);
                        this.runningClients.splice(this.runningClients.indexOf(client), 1);

                        // assign that agent to the next client in queue with those specs
                        if (assignedAgent.isIdle()) {
                            this.handleIdleFreeAgent(assignedAgent);
                        }
                    } else {
                        // remove it from the pending queue
                        for (let i = 0; i < this.pendingClients.length; i++) {
                            if (this.pendingClients[i] === client) {
                                this.pendingClients.splice(i, 1);
                            }
                        }
                    }
                });

                const notAssignedAgents = this.agentManager.getAgentsForSpec(spec)
                    .filter(agent => !this.assignedAgents.has(agent));

                if (notAssignedAgents.length > 0) {
                    this.assignAgentToClient(notAssignedAgents[0], client);
                } else {
                    // add client to pending queue
                    this.pendingClients.push(client);
                    client.notifyInQueue(this.pendingClients.length);
                }
            }
        });
    };

    get agentManager() {
        return this._agentManager;
    }

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
        if (this.assignedAgents.has(agent)) {
            const assignedClient = this.assignedAgents.get(agent)!;

            if (assignedClient.jobsToRun > 0) {
                assignedClient.askForJob();
            } else {
                this.askJobFromRunningClientWithAgentSpecs(agent);
            }

            this.runJobFromQueueInAgent(agent);
        } else {
            this.handleIdleFreeAgent(agent);
        }
    };

    assignAgentToClient(agent: Agent, client: Client) {
        this.assignedAgents.set(agent, client);
        this.clientAgents.set(client, agent);
        this.runningClients.push(client);

        const positionInPendingClients = this.pendingClients.indexOf(client);
        if (positionInPendingClients >= 0) {
            this.pendingClients.splice(positionInPendingClients, 1);
        }

        client.askForJob();

        // lets ask jobs till there is no more jobs or idleAgents
        const notAssignAndIdleAgents = this._agentManager.getIdleAgentsWithSpec(client.spec)
            .filter((agent) => !this.assignedAgents.has(agent));

        for (let i=0, n = Math.min(notAssignAndIdleAgents.length, client.jobsToRun); i< n; i++) {
            client.askForJob();
        }
    }

    private handleIdleFreeAgent(agent: Agent) {
        const filteredPendingClients = this.pendingClients.filter((client) => agent.canRunJob(client.spec!));

        if (filteredPendingClients.length > 0) {
            const notAssignedClient = filteredPendingClients[0];

            this.assignAgentToClient(agent, notAssignedClient);
        } else {
            this.askJobFromRunningClientWithAgentSpecs(agent);
            this.runJobFromQueueInAgent(agent);
        }
    }

    askJobFromRunningClientWithAgentSpecs(agent: Agent) {
        const runningClientsForAgent = this.runningClients.filter((client) => client.jobsToRun > 0 && agent.canRunJob(client.spec!));

        if (runningClientsForAgent.length > 0) {
            runningClientsForAgent[0].askForJob();
        }
    }

    runJobFromQueueInAgent(agent: Agent) {
        // run from the queue
        for (const job of this._incomingQueue) {
            if (agent.canRunJob(job!.spec)) {
                this._incomingQueue.remove(job!);
                agent.runJob(job!);
                break;
            }
        }
    }
}
