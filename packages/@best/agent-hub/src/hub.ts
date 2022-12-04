/*
 * Copyright (c) 2019, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: MIT
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/MIT
 */
import { EventEmitter } from 'events';
import { Server } from 'http';
import {
    HubConfig,
    RemoteClientConfig,
    BrowserSpec,
    BenchmarkRuntimeConfig,
    BestAgentState,
    BenchmarkUpdateState,
} from '@best/types';
import { normalizeClientConfig, normalizeSpecs } from '@best/utils';
import { Server as SocketIOServer, Socket } from 'socket.io';
import { BEST_RPC } from '@best/shared';
import { RemoteClient } from '@best/agent';
import { matchSpecs } from '@best/utils';
import RemoteAgent from './remote-agent';
import { validateConfig, validateToken } from './utils/validate';

export class Hub extends EventEmitter {
    private activeClients: Map<RemoteClient, RemoteAgent> = new Map();
    private agentsSocketServer: SocketIOServer;
    private clientsSocketServer: SocketIOServer;
    private connectedAgents = new Set<RemoteAgent>();
    private connectedClients = new Set<RemoteClient>();
    private hubConfig: HubConfig;

    constructor(server: Server, hubConfig: HubConfig) {
        super();

        this.hubConfig = hubConfig;

        this.clientsSocketServer = new SocketIOServer(server, { path: '/best' });
        this.clientsSocketServer.on('connect', this.onClientConnect.bind(this));

        this.agentsSocketServer = new SocketIOServer(server, { path: '/agents' });
        this.agentsSocketServer.on('connect', this.onAgentConnect.bind(this));
    }

    // -- Client lifecycle ---------------------------------------------------------------

    onClientConnect(clientSocket: Socket) {
        const query = clientSocket.handshake.query;
        const config = normalizeClientConfig(query);
        const invalidConfig = validateConfig(config, this.hubConfig, this.getAgentSpecs(), clientSocket.id);

        if (invalidConfig) {
            clientSocket.emit(BEST_RPC.AGENT_REJECTION, invalidConfig);
            return clientSocket.disconnect(true);
        }

        const remoteClient = this.setupNewClient(clientSocket, config);
        console.log(`[HUB] Connected clients: ${this.connectedClients.size}`);

        if (this.idleAgentMatchingSpecs(remoteClient)) {
            this.runBenchmarks(remoteClient);
        } else {
            remoteClient.log(`Client enqueued. Waiting for an agent to be free...`);
            this.emit(BEST_RPC.AGENT_QUEUED_CLIENT, {
                clientId: remoteClient.getId(),
                jobs: config.jobs,
                specs: config.specs,
            });
        }
    }

    setupNewClient(socketClient: Socket, clientConfig: RemoteClientConfig): RemoteClient {
        // Create and new RemoteClient and add it to the pool
        const remoteClient = new RemoteClient(socketClient, clientConfig);
        this.connectedClients.add(remoteClient);

        console.log(
            `[HUB] New client ${remoteClient.getId()} connected. Jobs requested ${
                clientConfig.jobs
            } | specs: ${JSON.stringify(clientConfig.specs)}`,
        );
        this.emit(BEST_RPC.AGENT_CONNECTED_CLIENT, {
            clientId: remoteClient.getId(),
            jobs: clientConfig.jobs,
            specs: remoteClient.getSpecs(),
        });

        // Make sure we remove it from an agent's perspective if the client is disconnected
        remoteClient.on(BEST_RPC.DISCONNECT, () => {
            console.log(`[HUB] Disconnected client ${remoteClient.getId()}`);
            this.emit(BEST_RPC.AGENT_DISCONNECTED_CLIENT, remoteClient.getId());
            this.connectedClients.delete(remoteClient);
            console.log(`[HUB] Connected clients: ${this.connectedClients.size}`);

            // If the client is actively running something we need to kill it
            if (this.activeClients.has(remoteClient)) {
                const remoteAgent = this.activeClients.get(remoteClient);
                if (remoteAgent && remoteAgent.isBusy()) {
                    remoteAgent.interruptRunner();
                }

                this.activeClients.delete(remoteClient);
            }
        });

        remoteClient.on(BEST_RPC.BENCHMARK_START, (benchmarkId: string) => {
            const agent = this.activeClients.get(remoteClient);
            this.emit(BEST_RPC.BENCHMARK_START, {
                agentId: agent && agent.getId(),
                clientId: remoteClient.getId(),
                benchmarkId,
            });
        });

        remoteClient.on(BEST_RPC.BENCHMARK_END, (benchmarkId: string) => {
            const agent = this.activeClients.get(remoteClient);
            this.emit(BEST_RPC.BENCHMARK_END, {
                agentId: agent && agent.getId(),
                clientId: remoteClient.getId(),
                benchmarkId,
            });
        });

        remoteClient.on(
            BEST_RPC.BENCHMARK_UPDATE,
            (benchmarkId: string, state: BenchmarkUpdateState, opts: BenchmarkRuntimeConfig) => {
                const agent = this.activeClients.get(remoteClient);
                this.emit(BEST_RPC.BENCHMARK_UPDATE, {
                    agentId: agent && agent.getId(),
                    clientId: remoteClient.getId(),
                    benchmarkId,
                    state,
                    opts,
                });
            },
        );

        // If we are done with the job, make sure after a short time the client gets removed
        remoteClient.on(BEST_RPC.REMOTE_CLIENT_EMPTY_QUEUE, () => {
            console.log(`[HUB] Remote client ${remoteClient.getId()} is done. Scheduling a force disconnect.`);
            setTimeout(() => {
                if (this.connectedClients.has(remoteClient)) {
                    console.log(
                        `[HUB] Force client disconnect (${remoteClient.getId()}): With no more jobs to run an agent must disconnect`,
                    );
                    remoteClient.disconnectClient(
                        `Forced disconnect: With no more jobs client should have disconnected`,
                    );
                }
            }, 10000);
        });

        return remoteClient;
    }

    // -- Agent lifecycle ---------------------------------------------------------------

    onAgentConnect(agentSocket: Socket) {
        const query = agentSocket.handshake.query;
        const specs = normalizeSpecs(query);
        const validToken = validateToken(query.authToken as string, this.hubConfig.authToken);
        const hasSpecs = specs.length > 0;

        if (!validToken) {
            agentSocket.emit(BEST_RPC.AGENT_REJECTION, 'Invalid Token');
            return agentSocket.disconnect(true);
        }

        if (!hasSpecs) {
            agentSocket.emit(BEST_RPC.AGENT_REJECTION, 'An agent must provide specs');
            return agentSocket.disconnect(true);
        }

        if (!query.agentUri) {
            agentSocket.emit(BEST_RPC.AGENT_REJECTION, 'An agent must provide a URI');
            return agentSocket.disconnect(true);
        }

        const remoteAgent = this.setupNewAgent(agentSocket, specs, {
            agentUri: query.agentUri,
            agentToken: query.agentAuthToken,
        });

        if (remoteAgent) {
            // If queued jobs with those specs, run them...
        }
    }

    setupNewAgent(socketAgent: Socket, specs: BrowserSpec[], { agentUri, agentToken }: any): RemoteAgent {
        // Create and new RemoteAgent and add it to the pool
        const remoteAgent = new RemoteAgent(socketAgent, { uri: agentUri, token: agentToken, specs });
        this.connectedAgents.add(remoteAgent);

        console.log(
            `[HUB] New Agent ${remoteAgent.getId()} connected with specs: ${JSON.stringify(remoteAgent.getSpecs())}`,
        );
        this.emit(BEST_RPC.HUB_CONNECTED_AGENT, {
            agentId: remoteAgent.getId(),
            specs: remoteAgent.getSpecs(),
            uri: remoteAgent.getUri(),
        });

        // Make sure we remove it from an agent's perspective if the client is disconnected
        remoteAgent.on(BEST_RPC.DISCONNECT, () => {
            console.log(`[HUB] Disconnected Agent ${remoteAgent.getId()}`);
            this.emit(BEST_RPC.HUB_DISCONNECTED_AGENT, { agentId: remoteAgent.getId() });
            this.connectedAgents.delete(remoteAgent);

            if (remoteAgent.isBusy()) {
                remoteAgent.interruptRunner();
            }
        });

        return remoteAgent;
    }

    // -- Private methods ---------------------------------------------------------------

    async runBenchmarks(remoteClient: RemoteClient) {
        // New agent setup
        if (!this.activeClients.has(remoteClient)) {
            const matchingAgents = this.findAgentMatchingSpecs(remoteClient, { ignoreBusy: true });
            if (matchingAgents.length > 0) {
                const remoteAgent = matchingAgents[0];
                this.activeClients.set(remoteClient, remoteAgent);
                this.emit(BEST_RPC.AGENT_RUNNING_CLIENT, {
                    clientId: remoteClient.getId(),
                    agentId: remoteAgent.getId(),
                    jobs: remoteClient.getPendingBenchmarks(),
                });
                try {
                    await remoteAgent.runBenchmarks(remoteClient);
                } catch (err) {
                    console.log(`[HUB] Error running benchmark for remote client ${remoteClient.getId()}`);
                    remoteClient.disconnectClient(`Error running benchmark: ${(err as Error).message}`); // make sure we disconnect the agent
                } finally {
                    this.activeClients.delete(remoteClient);
                    queueMicrotask(() => this.runQueuedBenchmarks());
                }
            } else {
                console.log('[HUB] All agents are busy at this moment...');
            }
        } else {
            console.log(`[HUB] Client ${remoteClient.getId()} is actively running already`);
        }
    }

    runQueuedBenchmarks() {
        Array.from(this.connectedClients).forEach((remoteClient) => {
            if (!this.activeClients.has(remoteClient)) {
                if (this.idleAgentMatchingSpecs(remoteClient) && remoteClient.getPendingBenchmarks() > 0) {
                    console.log(
                        `[HUB] Running benchmark: "${remoteClient.getId()}" has ${remoteClient.getPendingBenchmarks()} to run`,
                    );
                    this.runBenchmarks(remoteClient);
                } else {
                    console.log(`[HUB] All matching agents still busy for ${remoteClient.getId()}`);
                }
            }
        });
    }

    getAgentSpecs(): BrowserSpec[] {
        const specs: BrowserSpec[] = [];
        for (const agent of this.connectedAgents) {
            specs.push(...agent.getSpecs());
        }
        return specs;
    }

    idleAgentMatchingSpecs(remoteClient: RemoteClient): boolean {
        return this.findAgentMatchingSpecs(remoteClient, { ignoreBusy: true }).length > 0;
    }

    findAgentMatchingSpecs(remoteClient: RemoteClient, { ignoreBusy }: { ignoreBusy?: boolean } = {}): RemoteAgent[] {
        const specs = remoteClient.getSpecs();
        const agents: RemoteAgent[] = [];
        if (specs) {
            for (const agent of this.connectedAgents) {
                const matchesSpecs = matchSpecs(specs, agent.getSpecs() || []);
                const matchesFilterCriteria = ignoreBusy ? !agent.isBusy() : true;
                if (matchesSpecs && matchesFilterCriteria) {
                    agents.push(agent);
                }
            }
        }

        return agents;
    }

    // -- Public API ---------------------------------------------------------------

    getState(): BestAgentState {
        const connectedClients = Array.from(this.connectedClients).map((client) => client.getState());
        const connectedAgents = Array.from(this.connectedAgents).map((agent) => agent.getState());
        const activeClients = Array.from(this.activeClients).map(([rc, ra]) => ({
            clientId: rc.getId(),
            agentId: ra.getId(),
        }));
        return {
            connectedClients,
            connectedAgents,
            activeClients,
        };
    }

    /**
     * Gets a list of all agents connected to the hub
     * @returns an array with connected agents
     */
    getAgents() {
        return Array.from(this.connectedAgents).map((agent) => agent.getState());
    }

    /**
     * Gets agent info based on specified identifier.
     * @param id a unique identifier of an agent
     * @returns agent info
     */
    getAgent(id: string) {
        const agents = Array.from(this.connectedAgents)
            .filter((agent) => agent.getId() === id)
            .map((agent) => agent.getState());

        if (!agents || agents.length === 0) {
            return;
        }

        if (agents.length > 1) {
            throw new Error(`Multiple agents with the same ID found. ID: ${id}`);
        }

        return agents[0];
    }
}
