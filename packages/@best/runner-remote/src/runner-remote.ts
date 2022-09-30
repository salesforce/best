/*
 * Copyright (c) 2019, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: MIT
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/MIT
 */

import debug from 'debug';
import path from 'path';

import { io as Client, Socket as ClientSocket } from 'socket.io-client';

import { BEST_RPC } from '@best/shared';
import {
    BenchmarkResultsSnapshot,
    RunnerStream,
    BuildConfig,
    BenchmarkResultsState,
    BenchmarkRuntimeConfig,
} from '@best/types';
import { proxifiedSocketOptions } from '@best/utils';

import SocketIOFile from './utils/file-uploader';
import { createTarBundle } from './utils/create-tar';

const { AGENT_REJECTION, BENCHMARK_UPLOAD_REQUEST, CONNECT_ERROR, CONNECT, DISCONNECT, ERROR, RECONNECT_FAILED } =
    BEST_RPC;
const { BENCHMARK_END, BENCHMARK_ERROR, BENCHMARK_LOG, BENCHMARK_RESULTS, BENCHMARK_START, BENCHMARK_UPDATE } =
    BEST_RPC;
const RPC_METHODS = [
    AGENT_REJECTION,
    BENCHMARK_END,
    BENCHMARK_ERROR,
    BENCHMARK_LOG,
    BENCHMARK_RESULTS,
    BENCHMARK_START,
    BENCHMARK_UPDATE,
    BENCHMARK_UPLOAD_REQUEST,
    CONNECT_ERROR,
    CONNECT,
    DISCONNECT,
    ERROR,
    RECONNECT_FAILED,
];

const THROW_FUNCTION = function (err: any) {
    throw new Error(err || 'unknown error');
};

const log_rpc = debug('runner-remote:rpc');

export class RunnerRemote {
    private uri: string;
    private running: boolean = false;
    private uploader?: SocketIOFile;
    private pendingBenchmarks: number;
    private socket: ClientSocket;
    private benchmarkBuilds: BuildConfig[];
    private runnerLogStream: RunnerStream;
    private benchmarkResults: BenchmarkResultsSnapshot[] = [];
    private uploadingBenchmark: boolean = false;
    private _onBenchmarkError: Function = THROW_FUNCTION;
    private _onBenchmarksRunSuccess: Function = THROW_FUNCTION;

    constructor(benchmarksBuilds: BuildConfig[], runnerLogStream: RunnerStream, config: any) {
        const { uri, options, specs, token } = config;

        const socketOptions = {
            path: '/best',
            reconnection: false,
            autoConnect: false,
            query: {
                ...options,
                specs: JSON.stringify(specs),
                jobs: benchmarksBuilds.length,
            },
            pfx: [],
        };

        if (token) {
            socketOptions.query.authToken = token;
        }

        this.uri = uri;
        this.socket = Client(uri, proxifiedSocketOptions(socketOptions));
        this.benchmarkBuilds = benchmarksBuilds;
        this.pendingBenchmarks = benchmarksBuilds.length;
        this.runnerLogStream = runnerLogStream;

        RPC_METHODS.forEach((methodName) => this.socket.on(methodName, (this as any)[methodName].bind(this)));
    }

    // -- Socket lifecycle ----------------------------------------------------------------------

    [CONNECT]() {
        log_rpc(`socket:connect`);
    }

    [CONNECT_ERROR]() {
        log_rpc('socket:error');
        this._triggerBenchmarkError(`Unable to connect to agent "${this.uri}" (socket:connect_error)`);
    }

    [DISCONNECT]() {
        log_rpc('socket:disconnect');
        this._triggerBenchmarkError('socket:disconnect');
    }

    [ERROR]() {
        log_rpc('socket:error');
        this._triggerBenchmarkError('socket:reconnect_failed');
    }

    [RECONNECT_FAILED]() {
        log_rpc('reconnect_failed');
        this._triggerBenchmarkError('socket:reconnect_failed');
    }

    // -- Specific Best RPC Commands ------------------------------------------------------------

    [AGENT_REJECTION](reason: string) {
        log_rpc(`agent_rejection: ${AGENT_REJECTION}`);
        this._triggerBenchmarkError(reason);
    }

    [BENCHMARK_UPLOAD_REQUEST]() {
        const benchmarkConfig = this.benchmarkBuilds.shift();

        if (!benchmarkConfig) {
            return this._triggerBenchmarkError('Agent is requesting more jobs than specified');
        }

        if (this.uploadingBenchmark) {
            return this._triggerBenchmarkError('Already uploading a benchmark');
        }

        log_rpc(`${BENCHMARK_UPLOAD_REQUEST} - Sending: ${benchmarkConfig.benchmarkSignature}`);

        this.socket.emit(BEST_RPC.BENCHMARK_UPLOAD_RESPONSE, benchmarkConfig, async (benchmarkSignature: string) => {
            const { benchmarkName, benchmarkEntry, benchmarkRemoteEntry } = benchmarkConfig;
            const bundleDirname = path.dirname(benchmarkRemoteEntry || benchmarkEntry);
            const tarBundle = path.resolve(bundleDirname, `${benchmarkName}.tgz`);

            try {
                await createTarBundle(bundleDirname, benchmarkName);
                const uploader = await this._getUploaderInstance();
                uploader.upload(tarBundle);
            } catch (err) {
                return this._triggerBenchmarkError(err);
            }
        });
    }

    [BENCHMARK_RESULTS](results: BenchmarkResultsSnapshot[]) {
        this.benchmarkResults.push(...results);
        this.pendingBenchmarks -= 1;

        log_rpc(`${BENCHMARK_UPLOAD_REQUEST} - Received results, pending ${this.pendingBenchmarks}`);

        if (this.pendingBenchmarks === 0) {
            if (this.benchmarkBuilds.length === 0) {
                this._triggerBenchmarkSucess();
            } else {
                this._triggerBenchmarkError('Results missmatch: Agent has sent more jobs that benchmarks consumed...');
            }
        }
    }

    // -- Logger methods (must be side effect free) --------------------------------------------------------------------

    [BENCHMARK_START](benchmarkSignature: string) {
        this.runnerLogStream.onBenchmarkStart(benchmarkSignature);
    }

    [BENCHMARK_UPDATE](benchmarkSignature: string, state: BenchmarkResultsState, runtimeOpts: BenchmarkRuntimeConfig) {
        this.runnerLogStream.updateBenchmarkProgress(benchmarkSignature, state, runtimeOpts);
    }

    [BENCHMARK_END](benchmarkSignature: string) {
        this.runnerLogStream.onBenchmarkEnd(benchmarkSignature);
    }

    [BENCHMARK_ERROR](benchmarkSignature: string) {
        this.runnerLogStream.onBenchmarkError(benchmarkSignature);
    }

    [BENCHMARK_LOG](msg: string) {
        this.runnerLogStream.log(msg);
    }

    // -- Private  --------------------------------------------------------------------

    _getUploaderInstance(): Promise<SocketIOFile> {
        if (this.uploader) {
            return Promise.resolve(this.uploader);
        }

        return new Promise((resolve, reject) => {
            const uploader = new SocketIOFile(this.socket);

            const cancelRejection = setTimeout(() => {
                reject('[RUNNER_REMOTE] uploader:error | Unable to stablish connection for upload benchmarks');
            }, 10000);

            uploader.on('start', () => {
                log_rpc('uploader:start');
                this.uploadingBenchmark = true;
            });

            uploader.on('error', (err) => {
                log_rpc('uploader:error');
                this._triggerBenchmarkError(err);
            });

            uploader.on('complete', () => {
                log_rpc('uploader:complete');
                this.uploadingBenchmark = false;
            });

            uploader.on('ready', () => {
                log_rpc('uploader:ready');
                this.uploader = uploader;
                clearTimeout(cancelRejection);
                resolve(uploader);
            });
        });
    }

    _triggerBenchmarkSucess() {
        if (this.running) {
            this.running = false;
            this.socket.disconnect();
            this._onBenchmarksRunSuccess(this.benchmarkResults);
            this._onBenchmarksRunSuccess = THROW_FUNCTION; // To catch side-effects and race conditions
        }
    }

    _triggerBenchmarkError(error_msg: string | Error) {
        if (this.running) {
            const error = typeof error_msg === 'string' ? new Error(error_msg) : error_msg;
            this.running = false;
            this._onBenchmarkError(error);
            this._onBenchmarkError = THROW_FUNCTION; // To catch side-effects and race conditions
        }
    }

    run(): Promise<BenchmarkResultsSnapshot[]> {
        return new Promise((resolve, reject) => {
            this._onBenchmarksRunSuccess = resolve;
            this._onBenchmarkError = reject;
            this.running = true;
            this.socket.open();
        });
    }

    interruptRunner() {
        if (this.running) {
            this.socket.disconnect();
        }
    }
}
