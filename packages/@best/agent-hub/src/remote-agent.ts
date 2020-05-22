/*
 * Copyright (c) 2019, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: MIT
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/MIT
 */
import { BEST_RPC } from "@best/shared";
import { EventEmitter } from "events";
import { Socket } from "socket.io";
import { BrowserSpec } from "@best/types";
import { RemoteClient } from "@best/agent";
import { RunnerRemote } from "@best/runner-remote";

enum RemoteAgentState {
    IDLE,
    BUSY
}

const { DISCONNECT, CONNECT_ERROR, ERROR, RECONNECT_FAILED } = BEST_RPC;
const RPC_METHODS = [ DISCONNECT, CONNECT_ERROR, ERROR, RECONNECT_FAILED];

export default class RemoteAgent extends EventEmitter {
    private socket: Socket;
    private uri: string;
    private specs: BrowserSpec[];
    private token: string;
    public connected: boolean;
    private state: RemoteAgentState = RemoteAgentState.IDLE;
    private runner?: RunnerRemote;

    constructor(socket: Socket, { uri, specs, token }: any) {
        super();
        this.socket = socket;
        this.connected = this.socket.connected;
        this.specs = specs;
        this.uri = uri;
        this.token = token;
        RPC_METHODS.forEach((methodName) => this.socket.on(methodName, (this as any)[methodName].bind(this)));
    }

    // -- Socket lifecycle ------------------------------------------------------------

    [DISCONNECT](reason: string) {
        if (this.connected) {
            console.log(`${this.getId()} - socket:disconnect`, reason);
            this.disconnectAgent(reason);
        }
    }

    [CONNECT_ERROR](reason: string) {
        console.log(`${this.getId()} - socket:connect_error`, reason);
        this.disconnectAgent(reason);
    }

    [ERROR](reason: string) {
        console.log(`${this.getId()} - socket:error`, reason);
        this.disconnectAgent(reason);
    }

    [RECONNECT_FAILED](reason: string) {
        console.log(`${this.getId()} - socket:reconnect_failed`, reason);
        this.disconnectAgent(reason);
    }

    // -- Specific Best RPC Commands ------------------------------------------------------------

    async runBenchmarks(remoteClient: RemoteClient, jobsToRun: number = remoteClient.getPendingBenchmarks()) {
        if (this.isIdle() && remoteClient.getPendingBenchmarks() > 0) {
            this.state = RemoteAgentState.BUSY;
            const iterator = Array.from(Array(jobsToRun), (x, index) => index + 1);
            const runnerConfig: any = { uri: this.uri, specs: remoteClient.getSpecs(), jobs: 1, options: {} };
            if (this.token) {
                runnerConfig.options.authToken = this.token;
            }

            try {
                for (const job of iterator) {
                    console.log(`[REMOTE_AGENT] Running job ${job} of ${jobsToRun}`);
                    const benchmarkBuild = await remoteClient.requestJob();
                    this.runner = new RunnerRemote([benchmarkBuild], remoteClient, runnerConfig);
                    const results = await this.runner.run();
                    remoteClient.sendResults(results);
                    console.log(`[REMOTE_AGENT_${this.getId()}] Completed job ${job} of ${jobsToRun}`);

                }
            } finally {
                 this.state = RemoteAgentState.IDLE;
                 this.runner = undefined;
            }
        }
    }

    interruptRunner() {
        if (this.isBusy() && this.runner) {
            this.runner.interruptRunner();
        }
    }

    isBusy() {
        return this.state === RemoteAgentState.BUSY;
    }

    isIdle() {
        return this.state === RemoteAgentState.IDLE;
    }

    disconnectAgent(reason?: string) {
        if (this.connected) {
            this.connected = false;
            this.socket.emit(BEST_RPC.AGENT_REJECTION, reason);
            this.socket.disconnect(true);
            this.emit(BEST_RPC.DISCONNECT, reason);
        }
    }
    getId() {
        return this.socket.id;
    }

    getSpecs() {
        return this.specs;
    }

    getUri() {
        return this.uri;
    }

    toString() {
        return `[REMOTE_AGENT_${this.getId()}]`;
    }

    getState() {
        return {
            agentId: this.getId(),
            state: this.isIdle() ? 'IDLE': 'BUSY',
            specs: this.specs,
            uri: this.uri
        };
    }

}
