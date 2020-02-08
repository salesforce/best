import { BEST_RPC } from "@best/shared";
import { EventEmitter } from "events";
import { Socket } from "socket.io";
import { loadBenchmarkJob, extractBenchmarkTarFile } from "./utils/benchmark-loader";
import { BrowserSpec, BuildConfig, RunnerStream, BenchmarkResultsState, BenchmarkRuntimeConfig } from "@best/types";
import path from "path";

export interface RemoteClientConfig {
    specs: BrowserSpec;
    jobs: number;
}

enum RemoteClientState {
    IDLE,
    REQUESTING_JOB_INFO,
    REQUESTING_JOB_PAYLOAD
}

export default class RemoteClient extends EventEmitter implements RunnerStream {
    private clientSocket: Socket;
    public connected: boolean;
    private specs: BrowserSpec;
    private pendingJobs: number;
    private state: RemoteClientState = RemoteClientState.IDLE;
    private _requestJobSuccess: Function = function () {};
    private _requestJobError: Function = function (err: any) { throw new Error(err) };

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

    async [BEST_RPC.BENCHMARK_UPLOAD_RESPONSE](benchmarkConfig: BuildConfig, ack: Function) {
        if (this.state !== RemoteClientState.REQUESTING_JOB_INFO) {
            this.disconnectClient('Client should not send jobs at this point.');
            this._requestJobError('Unexpected upload response');
        }

        console.log(`[RC] Receiving benchmark ${benchmarkConfig.benchmarkSignature} from socket ${this.clientSocket.id}`);

        // Get ready to receive the payload
        const { benchmarkEntry, benchmarkName } = benchmarkConfig;
        ack(benchmarkEntry);
        this.state = RemoteClientState.REQUESTING_JOB_PAYLOAD;
        try {
            const { uploadDir: tarFile } = await loadBenchmarkJob(this.clientSocket);
            const uploadDir = path.dirname(tarFile);
            await extractBenchmarkTarFile(tarFile);
            benchmarkConfig.benchmarkEntry = path.join(uploadDir, `${benchmarkName}.html`);
            benchmarkConfig.benchmarkFolder = uploadDir;
            this.state = RemoteClientState.IDLE;
            console.log(`[RC] Completed upload for benchmark ${benchmarkConfig.benchmarkSignature} from socket ${this.clientSocket.id}`);
            this.pendingJobs -= 1;
            this._requestJobSuccess(benchmarkConfig);

        } catch(err) {
            this.disconnectClient(err);
            this._requestJobError(err);
        }
    }

    [BEST_RPC.BENCHMARK_UPLOAD_REQUEST]() {
        console.log('noop');
    }

    [BEST_RPC.BENCHMARK_START]() {
        console.log('noop');
    }

    [BEST_RPC.BENCHMARK_UPDATE]() {
        console.log('noop');
    }

    [BEST_RPC.BENCHMARK_END]() {
        console.log('noop');
    }

    [BEST_RPC.BENCHMARK_ERROR]() {
        console.log('noop');
    }
    [BEST_RPC.BENCHMARK_LOG]() {
        console.log('noop');
    }

    [BEST_RPC.BENCHMARK_RESULTS]() {
        console.log('noop');
    }

    // -- RunnerStream methods ----------------------------------------------------------

    init() {}

    finish() {}

    onBenchmarkStart(benchmarkSignature: string) {
        if (this.clientSocket.connected) {
            console.log(`[RC] benchmarkStart(${benchmarkSignature})`);
            this.clientSocket.emit(BEST_RPC.BENCHMARK_START, benchmarkSignature);
        }
    }

    onBenchmarkEnd(benchmarkSignature: string) {
        console.log(`[RC] benchmarkEnd(${benchmarkSignature})`);
        if (this.clientSocket.connected) {
            this.clientSocket.emit(BEST_RPC.BENCHMARK_END, benchmarkSignature);
        }
    }

    onBenchmarkError(benchmarkSignature: string) {
        if (this.clientSocket.connected) {
            this.clientSocket.emit(BEST_RPC.BENCHMARK_ERROR, benchmarkSignature);
        }
    }

    updateBenchmarkProgress(benchmarkSignature: string, state: BenchmarkResultsState, opts: BenchmarkRuntimeConfig) {
        if (this.clientSocket.connected) {
            this.clientSocket.emit(BEST_RPC.BENCHMARK_UPDATE, benchmarkSignature, state, opts);
        }
    }

    log(message: string) {
        if (this.clientSocket.connected) {
            this.clientSocket.emit(BEST_RPC.BENCHMARK_LOG, message);
        }
    }

    // -- Imperative methods ------------------------------------------------------------

    disconnectClient(reason: string) {
        this.connected = false;
        this.pendingJobs = -1;
        this.clientSocket.disconnect(true);
        this.emit(BEST_RPC.DISCONNECT, reason);
    }

    requestJob(): Promise<BuildConfig> {
        return new Promise((resolve, reject) => {
            this.state = RemoteClientState.REQUESTING_JOB_INFO;
            this.clientSocket.emit(BEST_RPC.BENCHMARK_UPLOAD_REQUEST);
            this._requestJobSuccess = resolve;
            this._requestJobError = reject;
        });
    }

    getPendingJobs() {
        return this.pendingJobs;
    }

    toString() {
        return `[RemoteClient](${this.clientSocket.id})`;
    }

    getId() {
        return this.toString();
    }

    getStatusInfo() {
        return `remining jobs: ${this.pendingJobs} | specs: ${this.specs} | state: ${this.state}`;
    }
}
