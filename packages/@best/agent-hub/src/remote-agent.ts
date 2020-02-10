import { BEST_RPC } from "@best/shared";
import { EventEmitter } from "events";
import { Socket } from "socket.io";
import { BrowserSpec, RunnerStream, BenchmarkResultsState, BenchmarkRuntimeConfig } from "@best/types";
import SocketIOFile from "socket.io-file";

enum RemoteAgentState {
    IDLE,
    BUSY
}

const { DISCONNECT, CONNECT_ERROR, ERROR, RECONNECT_FAILED } = BEST_RPC;
const RPC_METHODS = [ DISCONNECT, CONNECT_ERROR, ERROR, RECONNECT_FAILED];

export default class RemoteAgent extends EventEmitter implements RunnerStream {
    private socket: Socket;
    private uploader?: SocketIOFile;
    private specs: BrowserSpec[];
    public connected: boolean;
    private state: RemoteAgentState = RemoteAgentState.IDLE;
    private _requestJobSuccess: Function = function () {};
    private _requestJobError: Function = function (err: any) { throw new Error(err) };
    private debounce?: any;

    constructor(socket: Socket, { specs }: any) {
        super();
        this.socket = socket;
        this.connected = this.socket.connected;
        this.specs = specs;

        RPC_METHODS.forEach((methodName) => this.socket.on(methodName, (this as any)[methodName].bind(this)));
    }

    // -- Socket lifecycle ------------------------------------------------------------

    [DISCONNECT](reason: string) {
        if (this.connected) {
            console.log(`${this.getId()} - socket:disconnect`, reason);
            this.disconnectClient(reason);
        }
    }

    [CONNECT_ERROR](reason: string) {
        console.log(`${this.getId()} - socket:connect_error`, reason);
        this.disconnectClient(reason);
    }

    [ERROR](reason: string) {
        console.log(`${this.getId()} - socket:error`, reason);
        this.disconnectClient(reason);
    }

    [RECONNECT_FAILED](reason: string) {
        console.log(`${this.getId()} - socket:reconnect_failed`, reason);
        this.disconnectClient(reason);
    }

    // -- Specific Best RPC Commands ------------------------------------------------------------


    // -- RunnerStream methods ----------------------------------------------------------

    init() {
        console.log(`[AGENT-REMOTE-CLIENT] startingRunner`);
    }

    finish() {
        console.log(`[AGENT-REMOTE-CLIENT] finishingRunner`);
    }

    onBenchmarkStart(benchmarkSignature: string) {
        if (this.socket.connected) {
            console.log(`[AGENT-REMOTE-CLIENT] benchmarkStart(${benchmarkSignature})`);
            this.socket.emit(BEST_RPC.BENCHMARK_START, benchmarkSignature);
            this.emit(BEST_RPC.BENCHMARK_START, benchmarkSignature);
        }
    }

    onBenchmarkEnd(benchmarkSignature: string) {
        console.log(`[AGENT-REMOTE-CLIENT] benchmarkEnd(${benchmarkSignature})`);
        if (this.socket.connected) {
            this.socket.emit(BEST_RPC.BENCHMARK_END, benchmarkSignature);
            this.emit(BEST_RPC.BENCHMARK_END, benchmarkSignature);
        }
    }

    onBenchmarkError(benchmarkSignature: string) {
        if (this.socket.connected) {
            this.socket.emit(BEST_RPC.BENCHMARK_ERROR, benchmarkSignature);
            this.emit(BEST_RPC.BENCHMARK_ERROR, benchmarkSignature);
        }
    }

    updateBenchmarkProgress(benchmarkSignature: string, state: BenchmarkResultsState, opts: BenchmarkRuntimeConfig) {
        if (!this.debounce && this.socket.connected) {
            this.debounce = setTimeout(() => {
                this.debounce = undefined;
                if (this.socket.connected) {
                    console.log(`[AGENT-REMOTE-CLIENT] benchmarkProgress(${benchmarkSignature}) | iterations: ${state.executedIterations}`);
                    this.socket.emit(BEST_RPC.BENCHMARK_UPDATE, benchmarkSignature, state, opts);
                    this.emit(BEST_RPC.BENCHMARK_UPDATE, benchmarkSignature, state, opts);
                }
            }, 300);
        }
    }

    log(message: string) {
        if (this.socket.connected) {
            this.socket.emit(BEST_RPC.BENCHMARK_LOG, message);
        }
    }

    // -- Imperative methods ------------------------------------------------------------
    _deleteme() {
        console.log(this._requestJobError, this._requestJobSuccess, this.specs, this.uploader, this.state);
    }

    isBusy() {
        return this.state === RemoteAgentState.BUSY;
    }

    disconnectClient(reason?: string) {
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

    toString() {
        return `[REMOTE_AGENT_${this.getId()}]`;
    }

}
