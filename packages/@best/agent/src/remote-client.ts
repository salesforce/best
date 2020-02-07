import { BEST_RPC } from "@best/shared";
import { EventEmitter } from "events";
import { Socket } from "socket.io";
import { BrowserSpec } from "@best/types/src";

export interface RemoteClientConfig {
    specs: BrowserSpec;
    jobs: number;
}

enum RemoteClientState {
    IDLE,
    REQUESTING_JOB_INFO,
    REQUESTING_JOB_PAYLOAD
};

export default class RemoteClient extends EventEmitter {
    private clientSocket: Socket;
    public connected: boolean;
    private specs: BrowserSpec;
    private pendingJobs: number;
    private state: RemoteClientState = RemoteClientState.IDLE;
    private _requestJobSuccess?: Function;
    private _requestJobError?: Function;

    constructor(clientSocket: Socket, { specs, jobs }: RemoteClientConfig) {
        super();
        this.clientSocket = clientSocket;
        this.connected = this.clientSocket.connected;
        this.specs = specs;
        this.pendingJobs = jobs;

        Object.keys(BEST_RPC).forEach((key) => {
            const methodName = (BEST_RPC as any)[key];
            this.clientSocket.on(methodName, (this as any)[methodName].bind(this));
        });
    }

    // -- Socket lifecycle ------------------------------------------------------------
    [BEST_RPC.CONNECT](...args: any[]) {
        console.log('client - connect', args);
    }

    [BEST_RPC.DISCONNECT](reason: string) {
        console.log('client - disconnect', reason);
        this.disconnectClient(reason);
    }

    [BEST_RPC.CONNECT_ERROR](reason: string) {
        console.log('client - connect_error', reason);
        this.disconnectClient(reason);
    }

    [BEST_RPC.ERROR](reason: string) {
        console.log('client - error', reason);
        this.disconnectClient(reason);
    }

    [BEST_RPC.RECONNECT_FAILED](reason: string) {
        console.log('client - reconnect_failed', reason);
        this.disconnectClient(reason);
    }

    // -- Specific Best RPC Commands ------------------------------------------------------------

    [BEST_RPC.AGENT_STATUS](...args: any[]) {
        console.log('agent_status', args);
    }

    [BEST_RPC.AGENT_REJECTION](reason: string) {
        console.log('noop');
    }

    [BEST_RPC.BENCHMARK_INFO]() {
        console.log('benchmark_info');
    }

    [BEST_RPC.BENCHMARK_UPLOAD_REQUEST]() {

    }

    [BEST_RPC.BENCHMARK_UPLOAD_COMPLETED]() {

    }

    [BEST_RPC.BENCHMARK_UPLOAD_ERROR]() {

    }

    [BEST_RPC.BENCHMARK_START]() {

    }

    [BEST_RPC.BENCHMARK_UPDATE]() {

    }

    [BEST_RPC.BENCHMARK_END]() {

    }

    [BEST_RPC.BENCHMARK_ERROR]() {

    }

    [BEST_RPC.BENCHMARK_RESULTS]() {

    }

    // -- Imperative methods ------------------------------------------------------------

    disconnectClient(reason: string) {
        this.connected = false;
        this.pendingJobs = -1;
        this.clientSocket.disconnect(true);
        this.emit(BEST_RPC.DISCONNECT, reason);
    }

    requestJob() {
        return new Promise((resolve, reject) => {
            this.state = RemoteClientState.REQUESTING_JOB_INFO;
            this.clientSocket.emit(BEST_RPC.BENCHMARK_UPLOAD_REQUEST);
            this._requestJobSuccess = resolve;
            this._requestJobError = reject;
        });
    }

    _DELETEME() {
        console.log(this._requestJobError, this._requestJobSuccess);
    }

    toString() {
        return `remining jobs: ${this.pendingJobs} | specs: ${this.specs} | state: ${this.state}`;
    }
}
