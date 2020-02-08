/*
 * Copyright (c) 2019, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: MIT
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/MIT
*/

import socketIO, { Server as SocketIoServer, Socket } from "socket.io";
import { Server } from "http";
import { BrowserSpec } from "@best/types";
import { BEST_RPC } from "@best/shared";
import { runBenchmarks } from '@best/runner';
import { AgentConfig } from './utils/hub-registration';
import { createBundleConfig } from './utils/create-bundle-config';
import RemoteClient, { RemoteClientConfig } from "./remote-client";

enum AgentState {
    IDLE,
    BUSY,
}

export class Agent {
    private socketServer: SocketIoServer;
    private state: AgentState;
    private agentConfig: AgentConfig;
    private connectedClients = new Set<RemoteClient>();
    private activeClient?: RemoteClient;

    constructor(server: Server, agentConfig: AgentConfig) {
        this.agentConfig = agentConfig;
        this.socketServer = socketIO(server, { path: '/best' });
        this.socketServer.on('connect', this.connect.bind(this));
        this.state = AgentState.IDLE;
    }

    connect(socketClient: Socket) {
        const config = socketClient.handshake.query;
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

        if (this.idleState) {
            this.runBenchmark(remoteClient);
        }
    }

    async runBenchmark(remoteClient: RemoteClient) {
        if (this.idleState) {
            this.state === AgentState.BUSY;
            this.activeClient = remoteClient;
            try {
                console.log(`[AGENT] Requesting benchmark from RemoteClient ${remoteClient.getId()}`);
                const benchmarkBuild = await remoteClient.requestJob();
                const bundleConfig = createBundleConfig(benchmarkBuild, this.agentConfig);
                console.log(`[AGENT] Running benchmark ${benchmarkBuild.benchmarkSignature} from RemoteClient ${remoteClient.getId()}`);
                await runBenchmarks(bundleConfig, remoteClient);
            } catch(err) {
                console.log(`[AGENT] Error running benchmark for remote client ${remoteClient.getId()}`);
                console.log(err);
                this.activeClient = undefined;
            } finally {
                this.state === AgentState.IDLE;
            }

            queueMicrotask(() => this.runQueuedBenchmarks());
        }
    }

    runQueuedBenchmarks() {
        if (this.idleState) {
            console.log('[AGENT] Checking for queued agents and tasks...');
            if (this.activeClient && this.activeClient.getPendingJobs()) {
                this.runBenchmark(this.activeClient);
            }
        } else {
            console.log(`[AGENT] Busy, running ${this.activeClient!.getId()}`);
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
        // Normalize Config
        const remoteClientConfig: RemoteClientConfig = { specs: config.specs, jobs: parseInt(config.jobs, 10) };

        // Create and new RemoteClient and add it to the pool
        const remoteClient = new RemoteClient(socketClient, remoteClientConfig);
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
