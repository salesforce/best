import { BEST_RPC } from "@best/shared";
import { EventEmitter } from "events";
import { RemoteHubConfig, BrowserSpec } from "@best/types";
import socketIOClient from 'socket.io-client';

const { CONNECT, DISCONNECT, CONNECT_ERROR, ERROR, RECONNECT_FAILED, AGENT_REJECTION } = BEST_RPC;
const RPC_METHODS = [ CONNECT, DISCONNECT, CONNECT_ERROR, ERROR, RECONNECT_FAILED, AGENT_REJECTION];

const DEFAULT_SOCKET_CONFIG = {
    path: '/agents',
    reconnection: true,
    autoConnect: false
};

export default class RemoteHub extends EventEmitter {
    private hubSocket: SocketIOClient.Socket;
    private connected: boolean = false;
    private hubUri: string;

    constructor(remoteHubConfig: RemoteHubConfig, agentUri: string, agentSpecs: BrowserSpec[]) {
        super();

        const { uri } = remoteHubConfig;
        const socketOptions = {
            ...DEFAULT_SOCKET_CONFIG,
            query: {
                agentUri,
                specs: JSON.stringify(agentSpecs)
            }
        };

        this.hubUri = uri;

        this.hubSocket = socketIOClient(uri, socketOptions);
        RPC_METHODS.forEach((methodName) => this.hubSocket.on(methodName, (this as any)[methodName].bind(this)));
    }

    // -- Socket lifecycle ------------------------------------------------------------
    [CONNECT]() {
        console.log(`${this.getId()} - socket:connect`);
        this.connected = true;
    }

    [DISCONNECT](reason: string) {
        console.log(`${this.getId()} - socket:disconnect`, reason);
        // if (this.connected) {
        //     this.disconnectFromHub();
        // }
    }

    [CONNECT_ERROR](reason: string) {
        console.log(`${this.getId()} - socket:connect_error`, typeof reason);
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

    [AGENT_REJECTION](reason: string) {
        console.log(`${this.getId()} - socket:agent_rejection`, reason);
    }

    // -- Specific Best RPC Commands ------------------------------------------------------------

    disconnectFromHub(reason?: string) {
        if (this.connected) {
            this.connected = false;
            this.hubSocket.emit(BEST_RPC.AGENT_DISCONNECTED_FROM_HUB, reason);
            this.hubSocket.disconnect();
            this.emit(BEST_RPC.DISCONNECT, reason);
        }
    }

    getId() {
        return `[REMOTE_HUB(${this.hubUri})]`;
    }

    connectToHub() {
        console.log(`[REMOTE_HUB] Connecting To Hub: ${this.hubUri}`);
        this.hubSocket.open();
    }

    toString() {
        return `[REMOTE_HUB_${this.getId()}]`;
    }
}
