import { EventEmitter } from "events";
import { Server } from "http";
import { HubConfig, RemoteClientConfig } from "@best/types";
import { normalizeClientConfig } from '@best/utils';
import socketIO, { Server as SocketIoServer, Socket } from "socket.io";
import { BEST_RPC } from "@best/shared";
import { RemoteClient } from "@best/agent";
import { matchSpecs } from "@best/utils";
import RemoteAgent from "./remote-agent";

function validateConfig(config: RemoteClientConfig, hubConfig: HubConfig, socketId: string): string | undefined {
    return 'TODO';
}

export class Hub extends EventEmitter {
    private hubConfig: HubConfig;
    private clientsSocketServer: SocketIoServer;
    private agentsSocketServer: SocketIoServer;
    private connectedClients = new Set<RemoteClient>();
    private connectedAgents = new Set<RemoteAgent>();

    constructor(server: Server, hubConfig: HubConfig) {
        super();
        this.hubConfig = hubConfig;
        this.clientsSocketServer = socketIO(server, { path: '/best' });
        this.clientsSocketServer.on('connect', this.onClientConnect.bind(this));

        this.agentsSocketServer = socketIO(server, { path: '/best' });
        this.agentsSocketServer.on('connect', this.onAgentConnect.bind(this));
    }

    onClientConnect(socketClient: Socket) {
        const query = socketClient.handshake.query;
        const config = normalizeClientConfig(query);
        const invalidConfig = validateConfig(config, this.hubConfig, socketClient.id);

        if (invalidConfig) {
            socketClient.emit(BEST_RPC.AGENT_REJECTION, invalidConfig);
            return socketClient.disconnect(true);
        }

        const remoteClient = this.setupNewClient(socketClient, config);
        console.log(`[HUB] Connected clients: ${this.connectedClients.size}`);

        if (this.matchesAnyAgentSpec(remoteClient)) {
            console.log('WIP');
        }
    }

    onAgentConnect() {

    }

    setupNewClient(socketClient: Socket, clientConfig: RemoteClientConfig): RemoteClient {
        // Create and new RemoteClient and add it to the pool
        const remoteClient = new RemoteClient(socketClient, clientConfig);
        this.connectedClients.add(remoteClient);

        return remoteClient;
    }

    matchesAnyAgentSpec(remoteClient: RemoteClient): boolean {
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
