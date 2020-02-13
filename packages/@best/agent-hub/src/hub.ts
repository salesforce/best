import { EventEmitter } from "events";
import { Server } from "http";
import { HubConfig, RemoteClientConfig, BrowserSpec } from "@best/types";
import { normalizeClientConfig , normalizeSpecs } from '@best/utils';
import socketIO, { Server as SocketIoServer, Socket } from "socket.io";
import { BEST_RPC } from "@best/shared";
import { RemoteClient } from "@best/agent";
import { matchSpecs } from "@best/utils";
import RemoteAgent from "./remote-agent";
import { validateConfig, validateToken } from './utils/validate';

export class Hub extends EventEmitter {
    private hubConfig: HubConfig;
    private clientsSocketServer: SocketIoServer;
    private agentsSocketServer: SocketIoServer;
    private connectedClients = new Set<RemoteClient>();
    private connectedAgents = new Set<RemoteAgent>();
    private activeClients: Map<RemoteClient, RemoteAgent> = new Map();

    constructor(server: Server, hubConfig: HubConfig) {
        super();
        this.hubConfig = hubConfig;
        this.clientsSocketServer = socketIO(server, { path: '/best' });
        this.clientsSocketServer.on('connect', this.onClientConnect.bind(this));

        this.agentsSocketServer = socketIO(server, { path: '/agents' });
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
            this.emit(BEST_RPC.AGENT_QUEUED_CLIENT, { clientId: remoteClient.getId(), jobs: config.jobs, specs: config.specs });
        }
    }

    setupNewClient(socketClient: Socket, clientConfig: RemoteClientConfig): RemoteClient {
        // Create and new RemoteClient and add it to the pool
        const remoteClient = new RemoteClient(socketClient, clientConfig);
        this.connectedClients.add(remoteClient);

        console.log(`[HUB] New client ${remoteClient.getId()} connected. Jobs requested ${clientConfig.jobs} | specs: ${JSON.stringify(clientConfig.specs)}`);
        this.emit(BEST_RPC.AGENT_CONNECTED_CLIENT, { clientId: remoteClient.getId(), jobs: clientConfig.jobs });

        // Make sure we remove it from an agent's perspective if the client is disconnected
        remoteClient.on(BEST_RPC.DISCONNECT, () => {
            console.log(`[AGENT] Disconnected client ${remoteClient.getId()}`);
            this.emit(BEST_RPC.AGENT_DISCONNECTED_CLIENT, remoteClient.getId());
            this.connectedClients.delete(remoteClient);

            // If the client is actively running something we need to kill it
            if (this.activeClients.has(remoteClient)) {
                const remoteAgent = this.activeClients.get(remoteClient);
                if (remoteAgent && remoteAgent.isBusy()) {
                    remoteAgent.interruptRunner();
                }

                this.activeClients.delete(remoteClient);
            }
        });

        // If we are done with the job, make sure after a short time the client gets removed
        remoteClient.on(BEST_RPC.REMOTE_CLIENT_EMPTY_QUEUE, () => {
            setTimeout(() => {
                if (this.connectedClients.has(remoteClient)) {
                    console.log(`[AGENT] Force client disconnect (${remoteClient.getId()}): With no more jobs to run an agent must disconnect`);
                    remoteClient.disconnectClient(`Forced disconnect: With no more jobs client should have disconnected`);
                }
            }, 10000);
        });

        return remoteClient;
    }

    // -- Agent lifecycle ---------------------------------------------------------------

    onAgentConnect(agentSocket: Socket) {
        const query = agentSocket.handshake.query;
        const specs = normalizeSpecs(query);
        const validToken = validateToken(query.token, this.hubConfig.authToken);
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

        const remoteAgent = this.setupNewAgent(agentSocket, query.agentUri, specs);

        if (remoteAgent) {
            // If queued jobs with those specs, run them...
        }
    }

    setupNewAgent(socketAgent: Socket, uri: string, specs: BrowserSpec[]): RemoteAgent {

        // Create and new RemoteAgent and add it to the pool
        const remoteAgent = new RemoteAgent(socketAgent, { uri, specs });
        this.connectedAgents.add(remoteAgent);

        console.log(`[HUB] New Agent ${remoteAgent.getId()} connected with specs: ${JSON.stringify(remoteAgent.getSpecs())}`);
        this.emit(BEST_RPC.HUB_CONNECTED_AGENT, { agentId: remoteAgent.getId(), specs: remoteAgent.getSpecs() });

        // Make sure we remove it from an agent's perspective if the client is disconnected
        remoteAgent.on(BEST_RPC.DISCONNECT, () => {
            console.log(`[HUB] Disconnected Agent ${remoteAgent.getId()}`);
            this.emit(BEST_RPC.HUB_DISCONNECTED_AGENT, remoteAgent.getId());
            this.connectedAgents.delete(remoteAgent);

            if (remoteAgent.isBusy()) {
                remoteAgent.interruptRunner();
            }
        });


        return remoteAgent;
    }

    async runBenchmarks(remoteClient: RemoteClient) {
        // New agent setup
        if (!this.activeClients.has(remoteClient)) {
            const matchingAgents = this.findAgentMatchingSpecs(remoteClient, { ignoreBusy: true });
            if (matchingAgents.length > 0) {
                const remoteAgent = matchingAgents[0];
                this.activeClients.set(remoteClient, remoteAgent);
                try {
                    await remoteAgent.runBenchmarks(remoteClient);
                } catch(err) {
                    console.log(`[HUB] Error running benchmark for remote client ${remoteClient.getId()}`);
                    remoteClient.disconnectClient(`Error running benchmark ${err}`); // make sure we disconnect the agent
                } finally {
                    this.activeClients.delete(remoteClient);
                    queueMicrotask(() => this.runQueuedBenchmarks());
                }
            } else {
                console.log('[HUB] All agents are busy at this moment...');
            }
        } else {
            console.log(`[HUB] Client ${remoteClient.getId()} is actively running already`)
        }
    }

    runQueuedBenchmarks() {
        Array.from(this.connectedClients).forEach((remoteClient) => {
            if (!this.activeClients.has(remoteClient)) {
                if (this.idleAgentMatchingSpecs(remoteClient)) {
                    console.log(`[HUB] Client "${remoteClient.getId()}" has ${remoteClient.getPendingBenchmarks()} to run`);
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
                const matchesFilterCriteria = ignoreBusy ? !agent.isBusy(): true;
                if (matchesSpecs && matchesFilterCriteria) {
                    agents.push(agent);
                }
            }
        }

        return agents;
    }
}
