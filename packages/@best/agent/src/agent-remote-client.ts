import { BEST_RPC } from "@best/shared";
import { EventEmitter } from "events";
import { Socket } from "socket.io";
import SocketIOFile from "socket.io-file";
import { getUploaderInstance, extractBenchmarkTarFile } from "./utils/benchmark-loader";
import { BrowserSpec, BuildConfig, RunnerStream, BenchmarkResultsState, BenchmarkRuntimeConfig } from "@best/types";
import path from "path";

export interface RemoteClientConfig {
    specs?: BrowserSpec;
    jobs: number;
    token?: string;
}

enum RemoteClientState {
    IDLE,
    REQUESTING_JOB_INFO,
    REQUESTING_JOB_PAYLOAD
}

const { DISCONNECT, CONNECT_ERROR, ERROR, RECONNECT_FAILED, BENCHMARK_UPLOAD_RESPONSE } = BEST_RPC;
const RPC_METHODS = [ DISCONNECT, CONNECT_ERROR, ERROR, RECONNECT_FAILED, BENCHMARK_UPLOAD_RESPONSE];

export default class RemoteClient extends EventEmitter implements RunnerStream {
    private socket: Socket;
    private uploader?: SocketIOFile;
    private specs?: BrowserSpec;
    public connected: boolean;
    private pendingBenchmarksToUpload: number;
    private pendingResultsToSend: number = 0;
    private state: RemoteClientState = RemoteClientState.IDLE;
    private _requestJobSuccess: Function = function () {};
    private _requestJobError: Function = function (err: any) { throw new Error(err) };

    constructor(socket: Socket, { specs, jobs }: RemoteClientConfig) {
        super();
        this.socket = socket;
        this.connected = this.socket.connected;
        this.specs = specs;
        this.pendingBenchmarksToUpload = jobs;

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

    async [BENCHMARK_UPLOAD_RESPONSE](benchmarkConfig: BuildConfig, emitContinuationForUpload: Function) {
        if (this.state !== RemoteClientState.REQUESTING_JOB_INFO) {
            this.disconnectClient('Client should not send jobs at this point.');
            this._requestJobError('Unexpected upload response');
        }

        console.log(`[AGENT-REMOTE-CLIENT] Receiving benchmark ${benchmarkConfig.benchmarkSignature} from socket ${this.socket.id}`);

        const { benchmarkEntry, benchmarkName, benchmarkSignature } = benchmarkConfig;
        const uploader = this.getUploader();

        this.state = RemoteClientState.REQUESTING_JOB_PAYLOAD;
        emitContinuationForUpload(benchmarkSignature); // This is an ACK, telling the client that is ok to send the file now

        try {
            // Retrieve an uncompress the benchmark bundle
            const tarFile = await uploader.load(benchmarkEntry);
            await extractBenchmarkTarFile(tarFile);

            // Modify the benchmark bundle to point to the new files
            const uploadDir = path.dirname(tarFile);
            benchmarkConfig.benchmarkEntry = path.join(uploadDir, `${benchmarkName}.html`);
            benchmarkConfig.benchmarkFolder = uploadDir;

            console.log(`[AGENT-REMOTE-CLIENT] Completed upload for benchmark ${benchmarkConfig.benchmarkSignature} from socket ${this.socket.id}`);
            this.state = RemoteClientState.IDLE;
            this.pendingBenchmarksToUpload -= 1;
            this.pendingResultsToSend += 1;
            this._requestJobSuccess(benchmarkConfig);

            // Notify upload updates
            this.emit(BEST_RPC.REMOTE_CLIENT_UPLOAD_COMPLETED);

        } catch(err) {
            this.disconnectClient(err);
            this._requestJobError(err);
        }

        finally {
            this.state = RemoteClientState.IDLE;
        }
    }

    // -- Private

    getUploader(): SocketIOFile {
        if (!this.uploader) {
            const uploader: SocketIOFile = getUploaderInstance(this.socket);
            uploader.on('stream', ({ wrote, size }: any) => {
                console.log(`  :: [ARC-${this.socket.id}] loading benchmark (${wrote} / ${size})`);
            });

            this.uploader = uploader;
        }

        return this.uploader;
    }

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
        }
    }

    onBenchmarkEnd(benchmarkSignature: string) {
        console.log(`[AGENT-REMOTE-CLIENT] benchmarkEnd(${benchmarkSignature})`);
        if (this.socket.connected) {
            this.socket.emit(BEST_RPC.BENCHMARK_END, benchmarkSignature);
        }
    }

    onBenchmarkError(benchmarkSignature: string) {
        if (this.socket.connected) {
            this.socket.emit(BEST_RPC.BENCHMARK_ERROR, benchmarkSignature);
        }
    }

    updateBenchmarkProgress(benchmarkSignature: string, state: BenchmarkResultsState, opts: BenchmarkRuntimeConfig) {
        console.log(`[AGENT-REMOTE-CLIENT] benchmarkProgress(${benchmarkSignature}) | iterations: ${state.executedIterations}`);
        if (this.socket.connected) {
            this.socket.emit(BEST_RPC.BENCHMARK_UPDATE, benchmarkSignature, state, opts);
        }
    }

    log(message: string) {
        if (this.socket.connected) {
            this.socket.emit(BEST_RPC.BENCHMARK_LOG, message);
        }
    }

    // -- Imperative methods ------------------------------------------------------------

    disconnectClient(reason?: string) {
        if (this.connected) {
            this.connected = false;
            this.pendingBenchmarksToUpload = -1;
            this.socket.emit(BEST_RPC.AGENT_REJECTION, reason);
            this.socket.disconnect(true);
            this.emit(BEST_RPC.DISCONNECT, reason);
        }
    }

    requestJob(): Promise<BuildConfig> {
        return new Promise((resolve, reject) => {
            this.state = RemoteClientState.REQUESTING_JOB_INFO;
            this.socket.emit(BEST_RPC.BENCHMARK_UPLOAD_REQUEST);
            this._requestJobSuccess = resolve;
            this._requestJobError = reject;
        });
    }

    sendResults(results: any) {
        this.pendingResultsToSend -= 1;
        this.socket.emit(BEST_RPC.BENCHMARK_RESULTS, results);
        if (this.pendingBenchmarksToUpload === 0 && this.pendingResultsToSend === 0) {
            this.emit(BEST_RPC.REMOTE_CLIENT_EMPTY_QUEUE);
        }
    }

    getPendingBenchmarks() {
        return this.pendingBenchmarksToUpload;
    }

    toString() {
        return `[ARC-${this.socket.id}]`;
    }

    getId() {
        return this.toString();
    }

    getStatusInfo() {
        return `remining jobs: ${this.pendingBenchmarksToUpload} | specs: ${this.specs} | state: ${this.state}`;
    }
}
