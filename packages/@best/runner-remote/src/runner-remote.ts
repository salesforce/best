import path from 'path';
import socketIO from 'socket.io-client';
import SocketIOFile from './utils/file-uploader';
import { createTarBundle } from './utils/create-tar';
import { BEST_RPC } from "@best/shared";
import {
    BenchmarkResultsSnapshot,
    RunnerStream,
    BuildConfig,
    BenchmarkResultsState,
    BenchmarkRuntimeConfig
} from "@best/types";

export class RunnerRemote {
    private uploader?: SocketIOFile;
    private socket: SocketIOClient.Socket;
    private benchmarkBuilds: BuildConfig[];
    private runnerLogStream: RunnerStream;
    private benchmarkResults: BenchmarkResultsSnapshot[] = [];
    private uploadingBenchmark: boolean = false;
    private _onBenchmarkError: Function = function (err: any) { throw new Error(err); };
    private _onBenchmarksRunSuccess: Function = function () {};

    constructor(benchmarksBuilds: BuildConfig[], runnerLogStream: RunnerStream, config: any ) {
        const { uri, options, specs } = config;
        const socketOptions = {
            path: '/best',
            reconnection: false,
            query: {
                ...options,
                specs: JSON.stringify(specs),
                jobs: benchmarksBuilds.length
            }
        };

        this.socket =  socketIO(uri, socketOptions);
        this.benchmarkBuilds = benchmarksBuilds;
        this.runnerLogStream = runnerLogStream;

        Object.keys(BEST_RPC).forEach((key) => {
            const methodName = (BEST_RPC as any)[key];
            this.socket.on(methodName, (this as any)[methodName].bind(this));
        });
    }

    // -- Socket lifecycle ------------------------------------------------------------
    [BEST_RPC.CONNECT](...args: any[]) {
        console.log('connect', args);
    }
    [BEST_RPC.DISCONNECT](...args: any[]) {
        console.log('disconnect', args);
    }

    [BEST_RPC.CONNECT_ERROR](...args: any[]) {
        console.log('connect_error', args);
    }
    [BEST_RPC.DISCONNECT](...args: any[]) {
        console.log('disconnect', args);
    }

    [BEST_RPC.ERROR](...args: any[]) {
        console.log('error', args);
    }

    [BEST_RPC.RECONNECT_FAILED](...args: any[]) {
        console.log('reconnect_failed', args);
    }

    // -- Specific Best RPC Commands ------------------------------------------------------------

    [BEST_RPC.AGENT_STATUS](...args: any[]) {
        console.log('agent_status', args);
    }

    [BEST_RPC.AGENT_REJECTION](reason: string) {
        this.triggerBenchmarkError(reason);
    }

    [BEST_RPC.BENCHMARK_UPLOAD_RESPONSE]() {
        console.log('noop:benchmark_upload_info');
    }

    [BEST_RPC.BENCHMARK_UPLOAD_REQUEST]() {
        const benchmarkConfig = this.benchmarkBuilds.shift();

        if (!benchmarkConfig) {
            return this.triggerBenchmarkError('Agent is requesting more jobs than specified');
        }

        if (this.uploadingBenchmark) {
            return this.triggerBenchmarkError('Already uploading a benchmark');
        }

        console.log(`[RR] Sending ${benchmarkConfig.benchmarkSignature}`);

        this.socket.emit(BEST_RPC.BENCHMARK_UPLOAD_RESPONSE, benchmarkConfig, async (entry: string) => {
            const { benchmarkName, benchmarkEntry } = benchmarkConfig;
            const bundleDirname = path.dirname(benchmarkEntry);
            const tarBundle = path.resolve(bundleDirname, `${benchmarkName}.tgz`);

            try {
                await createTarBundle(bundleDirname, benchmarkName);
            } catch(err) {
                return this.triggerBenchmarkError(err);
            }

            const uploader = await this.getUploaderInstance();
            uploader.upload(tarBundle);
        });
    }

    [BEST_RPC.BENCHMARK_START](benchmarkSignature: string) {
        this.runnerLogStream.onBenchmarkStart(benchmarkSignature);
    }

    [BEST_RPC.BENCHMARK_UPDATE](benchmarkSignature: string, state: BenchmarkResultsState, runtimeOpts: BenchmarkRuntimeConfig) {
        this.runnerLogStream.updateBenchmarkProgress(benchmarkSignature, state, runtimeOpts);
    }

    [BEST_RPC.BENCHMARK_END](benchmarkSignature: string) {
        this.runnerLogStream.onBenchmarkEnd(benchmarkSignature);
    }

    [BEST_RPC.BENCHMARK_ERROR](err: any) {
        this.triggerBenchmarkError(err);
    }

    [BEST_RPC.BENCHMARK_LOG](msg: string) {
        this.runnerLogStream.log(msg);
    }

    [BEST_RPC.BENCHMARK_RESULTS](results: BenchmarkResultsSnapshot) {
        this.benchmarkResults.push(results);
    }

    getUploaderInstance(): Promise<SocketIOFile> {
        if (this.uploader) {
            return Promise.resolve(this.uploader);
        }

        return new Promise((resolve, reject) => {
            const uploader = new SocketIOFile(this.socket);

            const cancelRejection = setTimeout(() => {
                reject('Unable to stablish connection for upload benchmarks');
            }, 10000);

            uploader.on('start', () => {
                console.log('[RR] uploader start');
                this.uploadingBenchmark = true;
            });

            uploader.on('error', (err) => {
                console.log('[RR] uploader error');
                this.triggerBenchmarkError(err);
            });

            uploader.on('complete', () => {
                console.log('[RR] uploader complete');
                this.uploadingBenchmark = false;
            });

            uploader.on('ready', () => {
                this.uploader = uploader;
                clearTimeout(cancelRejection);
                resolve(uploader);
            });
        });
    }

    triggerBenchmarkSucess() {
        this._onBenchmarksRunSuccess(this.benchmarkResults);
    }

    triggerBenchmarkError(error_msg: string | Error) {
        const error = typeof error_msg === 'string' ? new Error(error_msg) : error_msg;
        this._onBenchmarkError(error);
    }

    onBenchmarkError(callback: Function) {
        this._onBenchmarkError = callback;
    }

    onBenchmarksRunSuccess(callback: Function) {
        this._onBenchmarksRunSuccess = callback;
    }
}
