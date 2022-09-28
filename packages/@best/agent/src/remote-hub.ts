/*
 * Copyright (c) 2019, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: MIT
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/MIT
 */

import { EventEmitter } from 'events';

import socketIOClient from 'socket.io-client';

import { BEST_RPC } from '@best/shared';
import { RemoteHubConfig, BrowserSpec, AgentConfig } from '@best/types';

const { CONNECT, DISCONNECT, CONNECT_ERROR, ERROR, RECONNECTING, RECONNECT_FAILED, AGENT_REJECTION } = BEST_RPC;
const RPC_METHODS = [CONNECT, DISCONNECT, CONNECT_ERROR, ERROR, RECONNECTING, RECONNECT_FAILED, AGENT_REJECTION];

const DEFAULT_SOCKET_CONFIG = {
    path: '/agents',
    reconnection: true,
    autoConnect: false,
};

export default class RemoteHub extends EventEmitter {
    private hubSocket: SocketIOClient.Socket;
    private connected: boolean = false;
    private hubUri: string;

    constructor(remoteHubConfig: RemoteHubConfig, agentSpecs: BrowserSpec[], agentConfig: AgentConfig) {
        super();

        const { uri } = remoteHubConfig;
        const socketOptions: any = {
            ...DEFAULT_SOCKET_CONFIG,
            query: {
                agentUri: agentConfig.uri,
                agentAuthToken: agentConfig.authToken,
                specs: JSON.stringify(agentSpecs),
            },
        };

        if (remoteHubConfig.authToken) {
            socketOptions.query.authToken = remoteHubConfig.authToken;
        }

        if (remoteHubConfig.acceptSelfSignedCert != null) {
            // When the hub is using a self-signed cert to enable HTTPS,
            // SocketIO by default would reject connections to such endpoints.
            // To allow connections to the hub with a self-signed cert, the
            // `rejectUnauthorized` property has to false.
            socketOptions.rejectUnauthorized = !remoteHubConfig.acceptSelfSignedCert;
        }

        this.hubUri = uri;

        this.hubSocket = socketIOClient(uri, socketOptions);
        RPC_METHODS.forEach((methodName) => this.hubSocket.on(methodName, (this as any)[methodName].bind(this)));
    }

    // -- Socket lifecycle ------------------------------------------------------------

    [AGENT_REJECTION](reason: string) {
        console.log(`${this.getId()} - socket:agent_rejection`, reason);
    }

    [CONNECT]() {
        console.log(`${this.getId()} - socket:connect`);
        this.connected = true;
        this.emit(BEST_RPC.AGENT_CONNECTED_HUB, this.hubUri);
    }

    [CONNECT_ERROR](reason: any) {
        console.log(`${this.getId()} - socket:connect_error`, reason.message || reason);
    }

    [DISCONNECT](reason: string) {
        console.log(`${this.getId()} - socket:disconnect`, reason);
        this.emit(BEST_RPC.AGENT_DISCONNECTED_HUB);
    }

    [ERROR](reason: string) {
        console.log(`${this.getId()} - socket:error`, reason);
        if (this.connected) {
            this.disconnectFromHub();
        }
    }

    [RECONNECT_FAILED](reason: string) {
        console.log(`${this.getId()} - socket:reconnect_failed`, reason);
    }

    [RECONNECTING]() {
        console.log(`${this.getId()} - socket:reconnecting`);
    }

    // -- Specific Best RPC Commands ------------------------------------------------------------

    connectToHub() {
        console.log(`[REMOTE_HUB] Connecting To Hub: ${this.hubUri}`);
        this.hubSocket.open();
    }

    disconnectFromHub(reason?: string) {
        if (this.connected) {
            this.connected = false;
            this.hubSocket.emit(BEST_RPC.AGENT_DISCONNECTED_HUB, reason);
            this.hubSocket.disconnect();
            this.emit(BEST_RPC.DISCONNECT, reason);
        }
    }

    getId() {
        return `[REMOTE_HUB(${this.hubUri})]`;
    }

    toString() {
        return `[REMOTE_HUB_${this.getId()}]`;
    }
}
