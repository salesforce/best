/*
 * Copyright (c) 2019, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: MIT
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/MIT
*/

import socketIO, { Server as SocketIoServer, Socket } from "socket.io";
import { Server } from "http";
import { BrowserSpec, Interruption } from "@best/types";
import { BEST_RPC } from "@best/shared";
import { runBenchmarks, validateRunner, getBrowserSpecs } from '@best/runner';
import { AgentConfig, normalizeClientConfig } from './utils/config-utils';
import { createBundleConfig } from './utils/create-bundle-config';
import RemoteClient, { RemoteClientConfig } from "./agent-remote-client";
import { matchSpecs, RunnerInterruption } from "@best/utils";

enum AgentState {
    IDLE = 'IDLE',
    BUSY = 'BUSY',
}

export class Agent {
    private socketServer: SocketIoServer;
    private state: AgentState;
    private specs: BrowserSpec[] = [];
    private agentConfig: AgentConfig;
    private connectedClients = new Set<RemoteClient>();
    private activeClient?: RemoteClient;
    private interruption?: Interruption;

    constructor(server: Server, agentConfig: AgentConfig) {
        validateRunner(agentConfig.runner);
        this.agentConfig = agentConfig;
        this.socketServer = socketIO(server, { path: '/best' });
        this.socketServer.on('connect', this.onClientConnect.bind(this));
        this.state = AgentState.IDLE;
        this.loadRunnerSpecs();
    }

    async loadRunnerSpecs() {
        this.specs = await getBrowserSpecs(this.agentConfig.runner);
        console.log(`[AGENT] Available specs: ${JSON.stringify(this.specs)}`);
    }

    onClientConnect(socketClient: Socket) {
        const query = socketClient.handshake.query;
        const config = normalizeClientConfig(query);
        if (!this.validateToken(config.token, this.agentConfig.authToken)) {
            console.log(`[AGENT] Rejecting client (${socketClient.id}): Token missmatch`);
            socketClient.emit(BEST_RPC.AGENT_REJECTION, `Unable to match token.`);
            return socketClient.disconnect(true);
        }

        if (!this.validateSpecs(config.specs, this.specs)) {
            console.log(`[AGENT] Rejecting client (${socketClient.id}): Invalid specs ${JSON.stringify(config.specs)}`);
            socketClient.emit(BEST_RPC.AGENT_REJECTION, `Unable to match specs.`);
            return socketClient.disconnect(true);
        }

        if (!this.validateJobs(config.jobs)) {
            console.log(`[AGENT] Rejecting client (${socketClient.id}): No jobs specified`);
            socketClient.emit(BEST_RPC.AGENT_REJECTION, `Client must specify number of jobs in advance.`);
            return socketClient.disconnect(true);
        }

        const remoteClient = this.setupNewClient(socketClient, config);
        console.log(`[AGENT] Connected clients: ${this.connectedClients.size} | state: ${this.state}`);

        if (this.idleState) {
            this.runBenchmark(remoteClient);
        }
    }

    async runBenchmark(remoteClient: RemoteClient) {
        if (this.idleState) {
            this.state = AgentState.BUSY;
            this.activeClient = remoteClient;
            try {
                console.log(`[AGENT] Requesting benchmark from RemoteClient ${remoteClient.getId()}`);
                const benchmarkBuild = await remoteClient.requestJob();
                const bundleConfig = createBundleConfig(benchmarkBuild, this.agentConfig);

                console.log(`[AGENT] Running benchmark ${benchmarkBuild.benchmarkSignature} from RemoteClient ${remoteClient.getId()}`);
                this.interruption = new RunnerInterruption(benchmarkBuild.benchmarkSignature);
                const results = await runBenchmarks(bundleConfig, remoteClient, this.interruption);
                console.log(`[AGENT] Completed benchmark ${benchmarkBuild.benchmarkSignature} from RemoteClient ${remoteClient.getId()}`);
                remoteClient.sendResults(results);

            } catch(err) {
                console.log(`[AGENT] Error running benchmark for remote client ${remoteClient.getId()}`);
                console.log(err);
                remoteClient.disconnectClient(`Error running benchmark ${err}`); // make sure we disconnect the agent
            } finally {
                this.state = AgentState.IDLE;
                this.interruption = undefined;
                queueMicrotask(() => this.runQueuedBenchmarks());
            }
        }
    }

    runQueuedBenchmarks() {
        if (this.idleState) {
            console.log('[AGENT] Checking for queued agents and tasks...');
            if (this.activeClient && this.activeClient.getPendingBenchmarks()) {
                console.log(`[AGENT] Active Client "${this.activeClient.getId()}" has still ${this.activeClient.getPendingBenchmarks()} pending`);
                this.runBenchmark(this.activeClient);
            } else {
                // Note that there might be some clients with no jobs still connected (we give them some time to disconnect)
                // So to avoid race conditions we check for remaining jobs, rather that just check for an arbitrary client on the queue
                const remoteClient = Array.from(this.connectedClients).find(client => client.getPendingBenchmarks() > 0);

                if (remoteClient) {
                    console.log(`[AGENT] Client "${remoteClient.getId()}" has ${remoteClient.getPendingBenchmarks()} to run`);
                    this.runBenchmark(remoteClient);
                } else {
                    console.log('[AGENT] No more jobs to run at the moment');
                }
            }
        } else {
            console.log(`[AGENT] Busy, running ${this.activeClient!.getId()}`);
        }
    }

    get idleState() {
        return this.state === AgentState.IDLE;
    }

    validateToken(token?: string, requiredToken?: string) {
        return requiredToken ? requiredToken === token : true;
    }

    validateSpecs(specs?: BrowserSpec, agentSpecs: BrowserSpec[] = []) {
        return specs ? matchSpecs(specs, agentSpecs): true;
    }

    validateJobs(jobs: number) {
        return jobs > 0;
    }

    getState() {
        return `
            |> state: ${this.idleState ? 'IDLE' : 'BUSY'}
            |> clients: ${this.connectedClients.size}
            |> activeClient: ${!!this.activeClient}
        `;
    }

    setupNewClient(socketClient: Socket, clientConfig: RemoteClientConfig): RemoteClient {

        // Create and new RemoteClient and add it to the pool
        const remoteClient = new RemoteClient(socketClient, clientConfig);
        console.log(`[AGENT] New client ${remoteClient.getId()} connected. Jobs requested ${clientConfig.jobs} | specs: ${JSON.stringify(clientConfig.specs)}`);
        this.connectedClients.add(remoteClient);

        // Make sure we remove it from an agent's perspective if the client is disconnected
        remoteClient.on(BEST_RPC.DISCONNECT, () => {
            console.log(`[AGENT] Disconnected client ${remoteClient.getId()}`);
            this.connectedClients.delete(remoteClient);
            if (this.activeClient === remoteClient) {
                this.activeClient = undefined;
                if (this.interruption) {
                    console.log(`[AGENT] Halting benchmark runner`);
                    this.interruption.requestInterruption();
                }
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
}
