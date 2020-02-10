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
    private activeClients: Map<RemoteClient, Set<RemoteAgent>> = new Map();

    constructor(server: Server, hubConfig: HubConfig) {
        super();
        this.hubConfig = hubConfig;
        this.clientsSocketServer = socketIO(server, { path: '/best' });
        this.clientsSocketServer.on('connect', this.onClientConnect.bind(this));

        this.agentsSocketServer = socketIO(server, { path: '/agents' });
        this.agentsSocketServer.on('connect', this.onAgentConnect.bind(this));
    }

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
            console.log('WIP', this.activeClients.size);
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

            // TODO: If the client is actively running something we need to kill it
            throw new Error('TODOooOoooOOOo!');
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

        const remoteAgent = this.setupNewAgent(agentSocket, specs);

        if (remoteAgent) {
            // If queued jobs with those specs, run them...
        }
    }

    setupNewAgent(socketAgent: Socket, specs: BrowserSpec[]): RemoteAgent {

        // Create and new RemoteAgent and add it to the pool
        const remoteAgent = new RemoteAgent(socketAgent, { specs });
        this.connectedAgents.add(remoteAgent);

        console.log(`[HUB] New Agent ${remoteAgent.getId()} connected with specs: ${JSON.stringify(remoteAgent.getSpecs())}`);
        this.emit(BEST_RPC.HUB_CONNECTED_AGENT, { agentId: remoteAgent.getId(), specs: remoteAgent.getSpecs() });

        // Make sure we remove it from an agent's perspective if the client is disconnected
        remoteAgent.on(BEST_RPC.DISCONNECT, () => {
            console.log(`[HUB] Disconnected Agent ${remoteAgent.getId()}`);
            this.emit(BEST_RPC.HUB_DISCONNECTED_AGENT, remoteAgent.getId());
            this.connectedAgents.delete(remoteAgent);

            if (remoteAgent.isBusy()) {
                // TODO, if this was busy running a job, notify the client
                throw new Error('TODOOOOOOOO!!!');
            }
        });

        return remoteAgent;
    }

    getAgentSpecs(): BrowserSpec[] {
        const specs: BrowserSpec[] = [];
        for (const agent of this.connectedAgents) {
            specs.push(...agent.getSpecs());
        }
        return specs;
    }

    idleAgentMatchingSpecs(remoteClient: RemoteClient): boolean {
        const specs = remoteClient.getSpecs();
        if (specs) {
            for (const agent of this.connectedAgents) {
                if (matchSpecs(specs, agent.getSpecs() || [])) {
                    return true;
                }
            }
        }

        return false;
    }
}
