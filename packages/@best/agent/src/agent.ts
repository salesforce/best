/*
 * Copyright (c) 2019, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: MIT
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/MIT
*/

import socketIO, { Server as SocketIoServer, Socket } from "socket.io";
import { Server } from "http";
import { AgentState, BrowserSpec, Interruption, RemoteHubConfig, AgentConfig, RemoteClientConfig, BenchmarkRuntimeConfig, BestAgentState, BenchmarkUpdateState } from "@best/types";
import { BEST_RPC } from "@best/shared";
import { runBenchmarks, validateRunner, getBrowserSpecs } from '@best/runner';
import { normalizeClientConfig } from '@best/utils';
import { validateConfig } from './utils/validate';
import { createBundleConfig } from './utils/create-bundle-config';
import RemoteClient from "./remote-client";
import { RunnerInterruption } from "@best/utils";
import { EventEmitter } from "events";
import RemoteHub from "./remote-hub";

export class Agent extends EventEmitter {
    private id: string;
    private uri: string;
    private socketServer: SocketIoServer;
    private state: AgentState;
    private specs: BrowserSpec[] = [];
    private agentConfig: AgentConfig;
    private remoteHubConfig: RemoteHubConfig;
    private connectedClients = new Set<RemoteClient>();
    private activeClient?: RemoteClient;
    private interruption?: Interruption;

    constructor(server: Server, agentConfig: AgentConfig, remoteHubConfig: RemoteHubConfig) {
        super();

        validateRunner(agentConfig.runner);
        this.uri = agentConfig.uri;
        this.id = agentConfig.name || `Agent[${Date.now()}]`;
        this.agentConfig = agentConfig;
        this.remoteHubConfig = remoteHubConfig;
        this.socketServer = socketIO(server, { path: '/best' });
        this.socketServer.on('connect', this.onClientConnect.bind(this));
        this.state = AgentState.IDLE;
        this.loadRunnerSpecs();

        if (this.remoteHubConfig.uri) {
            this.once('ready', () => {
                const remoteHub = this.setupNewHub(this.remoteHubConfig, this.specs, this.agentConfig);
                remoteHub.connectToHub();
            });
        }
    }

    async loadRunnerSpecs() {
        this.specs = await getBrowserSpecs(this.agentConfig.runner);
        console.log(`[AGENT] Available specs: ${JSON.stringify(this.specs)}`);
        this.emit('ready');
    }

    onClientConnect(socketClient: Socket) {
        const query = socketClient.handshake.query;
        const config = normalizeClientConfig(query);
        const invalidConfig = validateConfig(config, this.agentConfig, this.specs, socketClient.id);

        if (invalidConfig) {
            socketClient.emit(BEST_RPC.AGENT_REJECTION, invalidConfig);
            return socketClient.disconnect(true);
        }

        const remoteClient = this.setupNewClient(socketClient, config);
        console.log(`[AGENT] Connected clients: ${this.connectedClients.size} | state: ${this.state} | activePending: ${this.activeClient && this.activeClient.getPendingBenchmarks()}`);

        if (this.idleState) {
            this.runBenchmark(remoteClient);
        } else {
            remoteClient.log(`Client enqueued. Waiting for the agent to be free...`);
            this.emit(BEST_RPC.AGENT_QUEUED_CLIENT, { clientId: remoteClient.getId(), jobs: config.jobs, specs: config.specs });
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
        } else {
            console.log('[AGENT] Benchmark already running...');
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

    get idleState() { return this.state === AgentState.IDLE; }

    getStateInfo() {
        return `
            |> state: ${this.idleState}
            |> clients: ${this.connectedClients.size}
            |> activeClient: ${this.activeClient && this.activeClient.getId()}
        `;
    }

    setupNewHub(remoteHubConfig: RemoteHubConfig, specs: BrowserSpec[], agentConfig: AgentConfig): RemoteHub {
        const remoteHub = new RemoteHub(remoteHubConfig, specs, agentConfig);
        remoteHub.on(BEST_RPC.AGENT_CONNECTED_HUB, (hubUri) => this.emit(BEST_RPC.AGENT_CONNECTED_HUB, hubUri));
        remoteHub.on(BEST_RPC.AGENT_DISCONNECTED_HUB, (hubUri) => this.emit(BEST_RPC.AGENT_DISCONNECTED_HUB, hubUri));
        return remoteHub;
    }

    setupNewClient(socketClient: Socket, clientConfig: RemoteClientConfig): RemoteClient {

        // Create and new RemoteClient and add it to the pool
        const remoteClient = new RemoteClient(socketClient, clientConfig);
        this.connectedClients.add(remoteClient);

        console.log(`[AGENT] New client ${remoteClient.getId()} connected. Jobs requested ${clientConfig.jobs} | specs: ${JSON.stringify(clientConfig.specs)}`);
        this.emit(BEST_RPC.AGENT_CONNECTED_CLIENT, { clientId: remoteClient.getId(), jobs: clientConfig.jobs });

        // Make sure we remove it from an agent's perspective if the client is disconnected
        remoteClient.on(BEST_RPC.DISCONNECT, () => {
            console.log(`[AGENT] Disconnected client ${remoteClient.getId()}`);
            this.emit(BEST_RPC.AGENT_DISCONNECTED_CLIENT, remoteClient.getId());

            this.connectedClients.delete(remoteClient);
            if (this.activeClient === remoteClient) {
                this.activeClient = undefined;
                if (this.interruption) {
                    console.log(`[AGENT] Halting benchmark runner`);
                    this.interruption.requestInterruption();
                }
            }

            /*
             * Once the disconnect happens, the agent is now able to
             * take on new tasks, hence, mark its state as "idle".
             */

            this.state = AgentState.IDLE;
        });

        // Forward events from the Client to the Agent
        remoteClient.on(BEST_RPC.BENCHMARK_START, (benchmarkId: string) => {
            this.emit(BEST_RPC.BENCHMARK_START, { agentId: this.id, clientId: remoteClient.getId(), benchmarkId });
        });

        remoteClient.on(BEST_RPC.BENCHMARK_END, (benchmarkId: string) => {
            this.emit(BEST_RPC.BENCHMARK_END, { agentId: this.id, clientId: remoteClient.getId(), benchmarkId });
        });

        remoteClient.on(BEST_RPC.BENCHMARK_UPDATE, (benchmarkId: string, state: BenchmarkUpdateState, opts: BenchmarkRuntimeConfig) => {
            this.emit(BEST_RPC.BENCHMARK_UPDATE, { agentId: this.id, clientId: remoteClient.getId(), benchmarkId, state, opts });
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

    getState(): BestAgentState {
        const connectedClients = Array.from(this.connectedClients).map((client) => client.getState());
        const activeClients = this.activeClient ? [{ agentId: this.id, clientId: this.activeClient.getId() }] : [];
        return {
            connectedClients,
            connectedAgents: [{
                agentId: this.id,
                state: this.idleState ? AgentState.IDLE: AgentState.BUSY,
                specs: this.specs,
                uri: this.uri
            }],
            activeClients
        };
    }

}

export { RemoteClient };
