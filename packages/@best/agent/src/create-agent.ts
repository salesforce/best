/*
 * Copyright (c) 2019, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: MIT
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/MIT
*/

import socketIO, { Server as SocketIoServer, Socket } from "socket.io";
import { Server } from "http";
import { AgentConfig } from './hub-registration';
import { BrowserSpec } from "@best/types";
import { BEST_RPC } from "@best/shared";
import RemoteClient, { RemoteClientConfig } from "./remote-client";

enum AgentState {
    IDLE,
    BUSY,
}

class Agent {
    private socketServer: SocketIoServer;
    private state: AgentState;
    private connectedClients = new Set<RemoteClient>();
    private activeClient?: RemoteClient;

    constructor(server: Server) {
        this.socketServer = socketIO(server, { path: '/best' });
        this.socketServer.on('connect', this.connect.bind(this));
        this.state = AgentState.IDLE;
    }

    connect(socketClient: Socket) {
        const config = socketClient.handshake.query;
        console.log(config);
        if (!this.validateToken(config.token)) {
            socketClient.disconnect(true);
        }

        if (!this.validateSpecs(config.specs)) {
            socketClient.emit(BEST_RPC.AGENT_REJECTION, `Unable to match specs ${config.specs}`);
            socketClient.disconnect(true);
        }

        if (!this.validateJobs(config.jobs)) {
            socketClient.emit(BEST_RPC.AGENT_REJECTION, `Client must specify number of jobs in advance.`);
            socketClient.disconnect(true);
        }

        const remoteClient = this.setupNewClient(socketClient, config);
        this.runBenchmark(remoteClient);
    }

    async runBenchmark(remoteClient: RemoteClient) {
        if (this.idleState) {
            this.state === AgentState.BUSY;
            this.activeClient = remoteClient;
            await remoteClient.requestJob();
        }

    }

    get idleState() {
        return this.state === AgentState.IDLE;
    }

    validateToken(token: string) {
        return !!token;
    }

    validateSpecs(specs: BrowserSpec[]) {
        return !!specs;
    }
    validateJobs(jobs: any) {
        return typeof jobs !== 'undefined';
    }

    getState() {
        return `
            |> state: ${this.idleState ? 'IDLE' : 'BUSY'}
            |> clients: ${this.connectedClients.size}
            |> activeClient: ${!!this.activeClient}
        `;
    }

    setupNewClient(socketClient: Socket, config: any): RemoteClient {
        const remoteClientConfig: RemoteClientConfig = {
            specs: config.specs,
            jobs: parseInt(config.jobs, 10)
        };

        const remoteClient = new RemoteClient(socketClient, remoteClientConfig);

        // Add it to the list of clients
        this.connectedClients.add(remoteClient);

        // Make sure we remove it from the agent when disconnected
        remoteClient.on(BEST_RPC.DISCONNECT, () => {
            this.connectedClients.delete(remoteClient);
            if (this.activeClient === remoteClient) {
                this.activeClient = undefined;
            }
        });

        return remoteClient;
    }
}


export function createAgent(server: Server, agentConfig: AgentConfig) {
    if (!agentConfig.runner) {
        throw new Error('An agent must have a runner attached to it');
    }

    const agent = new Agent(server);
    setInterval(() => {
        console.log('[agent-state]', agent.getState());
    }, 1000);
    return agent;
}
