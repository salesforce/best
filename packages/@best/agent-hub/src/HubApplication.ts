/*
 * Copyright (c) 2019, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: MIT
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/MIT
*/

import * as SocketIO from "socket.io";
import ObservableQueue from "./utils/ObservableQueue";
import BenchmarkJob from "./BenchmarkJob";
import { AgentManager } from "./AgentManager";
import {Agent, Spec} from "./Agent";
import {Client} from "./Client";
import AgentLogger from "@best/agent-logger";

export interface HubStatus {
    pendingJobCount: number
    pendingClientCount: number,
    runningClientCount: number,
}

export class HubApplication {
    private _incomingQueue: ObservableQueue<BenchmarkJob>;
    private _agentManager: AgentManager;
    private _logger: AgentLogger;

    private assignedAgents: WeakMap<Agent, Client> = new WeakMap<Agent, Client>();
    private clientAgents: WeakMap<Client, Agent> = new WeakMap<Client, Agent>();
    private pendingClients: Client[] = [];
    private runningClients: Client[] = [];

    constructor(incomingQueue: ObservableQueue<BenchmarkJob>, agentManager: AgentManager, logger: AgentLogger) {
        this._incomingQueue = incomingQueue;
        this._agentManager = agentManager;
        this._logger = logger;

        this.attachEventListeners();
    }

    getLoadStatus() : HubStatus {
        return {
            pendingJobCount: this.pendingClients.reduce((count, client) => count + client.jobsToRun, 0)
            + this.runningClients.reduce((count, client) => count + client.jobsToRun, 0) + this._incomingQueue.size,
            pendingClientCount: this.pendingClients.length,
            runningClientCount: this.runningClients.length
        }
    }

    handleIncomingSocketConnection = (socket: SocketIO.Socket) => {
        // @todo: define the types for the data.
        // @todo: add timeout on waiting the benchmark task?
        socket.on('benchmark_task', (data: any) => {
            this._logger.event(socket.id, 'benchmark added', { benchmarkName: data.benchmarkName })
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
                socket.emit('benchmark_error', 'There is no agent in the hub that match the specs to run this job.');
                socket.disconnect(true);
            }
        });

        socket.on('connect-client', (spec: Spec, jobs: number) => {
            const client = new Client(socket, spec, jobs);

            if (!this._agentManager.existAgentWithSpec(spec)) {
                // there is no agent to run this job
                socket.emit('hub-cancel', 'There is no agent in the hub that match the specs to run client benchmarks.');
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

                    this._logger.event("Hub", 'CLIENT_DISCONNECTED');

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

                this._logger.event("Hub", 'CLIENT_CONNECTED');
            }
        });
    };

    get agentManager() {
        return this._agentManager;
    }

    private attachEventListeners() {
        // @todo: rename the event to match each other
        this._agentManager.on('idle-agent', this.handleIdleAgent);
        this._agentManager.on("agent-removed", this.handleRemovedAgent)
        this._incomingQueue.on('item-added', this.handleJobReadyToRun);
    }

    private handleJobReadyToRun = (job: BenchmarkJob) => {
        const agent: Agent | null = this._agentManager.getIdleAgentForJob(job);

        if (agent !== null) {
            this._incomingQueue.remove(job);
            agent.runJob(job);
            this._logger.event("Hub", 'PENDING_JOB_CHANGED');
        } else {
            job.socketConnection.emit('benchmark_enqueued', { pending: this._incomingQueue.size });
            this._logger.event(job.socketConnection.id, 'benchmark queued', { pending: this._incomingQueue.size }, false);
        }
    };

    private handleRemovedAgent = (agent: Agent) => {
        if (this.assignedAgents.has(agent)) {
            const client: Client | undefined = this.assignedAgents.get(agent);
            this.assignedAgents.delete(agent);
            if (client) {
                this.clientAgents.delete(client);
            }
            this._logger.event("Hub", 'AGENT_STATUS_CHANGED');
        }
    }

    private handleIdleAgent = (agent: Agent) => {
        if (this.assignedAgents.has(agent)) {
            const assignedClient = this.assignedAgents.get(agent)!;

            if (assignedClient.jobsToRun > 0) {
                assignedClient.askForJob();
                this._logger.event("Hub", 'PENDING_JOB_CHANGED');
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
        this._logger.event("Hub", 'PENDING_JOB_CHANGED');
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
            this._logger.event("Hub", 'PENDING_JOB_CHANGED');
        }
    }

    runJobFromQueueInAgent(agent: Agent) {
        // run from the queue
        for (const job of this._incomingQueue) {
            if (agent.canRunJob(job!.spec)) {
                this._incomingQueue.remove(job!);
                this._logger.event("Hub", 'PENDING_JOB_CHANGED');
                agent.runJob(job!);
                break;
            }
        }
    }
}
