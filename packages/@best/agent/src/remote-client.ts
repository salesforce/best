/*
 * Copyright (c) 2019, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: MIT
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/MIT
 */

import { EventEmitter } from 'events';
import path from 'path';

import { Socket } from 'socket.io';
import SocketIOFile from 'socket.io-file';

import { BEST_RPC } from '@best/shared';
import {
    BrowserSpec,
    BuildConfig,
    RunnerStream,
    BenchmarkRuntimeConfig,
    BenchmarkUpdateState,
    AgentState,
} from '@best/types';
import { RemoteClientConfig } from '@best/types';

import { getUploaderInstance, extractBenchmarkTarFile } from './utils/benchmark-loader';

enum RemoteClientState {
    IDLE = 'IDLE',
    REQUESTING_JOB_INFO = 'REQUESTING_JOB_INFO',
    REQUESTING_JOB_PAYLOAD = 'REQUESTING_JOB_PAYLOAD',
}

const { DISCONNECT, CONNECT_ERROR, ERROR, RECONNECT_FAILED, BENCHMARK_UPLOAD_RESPONSE } = BEST_RPC;
const RPC_METHODS = [DISCONNECT, CONNECT_ERROR, ERROR, RECONNECT_FAILED, BENCHMARK_UPLOAD_RESPONSE];

export default class RemoteClient extends EventEmitter implements RunnerStream {
    private socket: Socket;
    private uploader?: SocketIOFile;
    private specs?: BrowserSpec;
    public connected: boolean;
    private pendingBenchmarksToUpload: number;
    private pendingResultsToSend: number = 0;
    private state: RemoteClientState = RemoteClientState.IDLE;
    private _requestJobSuccess: Function = function () {};
    private _requestJobError: Function = function (err: any) {
        throw new Error(err);
    };
    private debounce?: any;

    constructor(socket: Socket, { specs, jobs }: RemoteClientConfig) {
        super();
        this.socket = socket;
        this.connected = this.socket.connected;
        this.specs = specs;
        this.pendingBenchmarksToUpload = jobs;

        RPC_METHODS.forEach((methodName) => this.socket.on(methodName, (this as any)[methodName].bind(this)));
    }

    // -- Socket lifecycle ------------------------------------------------------------

    [CONNECT_ERROR](reason: string) {
        console.log(`${this.getId()} - socket:connect_error`, reason);
        this.disconnectClient(reason);
    }

    [DISCONNECT](reason: string) {
        if (this.connected) {
            console.log(`${this.getId()} - socket:disconnect`, reason);
            this.disconnectClient(reason);
        }
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

        console.log(
            `[AGENT_REMOTE_CLIENT] Receiving benchmark ${benchmarkConfig.benchmarkSignature} from socket ${this.socket.id}`,
        );

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
            benchmarkConfig.benchmarkRemoteEntry = path.join(uploadDir, `${benchmarkName}.html`);
            benchmarkConfig.benchmarkRemoteFolder = uploadDir;

            console.log(
                `[AGENT_REMOTE_CLIENT] Completed upload for benchmark ${benchmarkConfig.benchmarkSignature} from socket ${this.socket.id}`,
            );
            this.state = RemoteClientState.IDLE;
            this.pendingBenchmarksToUpload -= 1;
            this.pendingResultsToSend += 1;
            this._requestJobSuccess(benchmarkConfig);

            // Notify upload updates
            this.emit(BEST_RPC.REMOTE_CLIENT_UPLOAD_COMPLETED);
        } catch (err) {
            this.disconnectClient(err as any);
            this._requestJobError(err);
        } finally {
            this.state = RemoteClientState.IDLE;
        }
    }

    // -- Private

    getUploader(): any {
        if (!this.uploader) {
            const uploader = getUploaderInstance(this.socket);
            uploader.on('stream', ({ wrote, size }: any) => {
                console.log(`  :: [ARC-${this.socket.id}] loading benchmark (${wrote} / ${size})`);
            });

            this.uploader = uploader;
        }

        return this.uploader;
    }

    // -- RunnerStream methods ----------------------------------------------------------

    finish() {
        console.log(`[AGENT_REMOTE_CLIENT] finishingRunner`);
    }

    init() {
        console.log(`[AGENT_REMOTE_CLIENT] startingRunner`);
    }

    log(message: string) {
        if (this.socket.connected) {
            this.socket.emit(BEST_RPC.BENCHMARK_LOG, message);
        }
    }

    onBenchmarkEnd(benchmarkSignature: string) {
        console.log(`[AGENT_REMOTE_CLIENT] benchmarkEnd(${benchmarkSignature})`);
        if (this.socket.connected) {
            this.socket.emit(BEST_RPC.BENCHMARK_END, benchmarkSignature);
            this.emit(BEST_RPC.BENCHMARK_END, benchmarkSignature);
            clearTimeout(this.debounce);
            this.debounce = undefined;
        }
    }

    onBenchmarkError(benchmarkSignature: string) {
        if (this.socket.connected) {
            this.socket.emit(BEST_RPC.BENCHMARK_ERROR, benchmarkSignature);
            this.emit(BEST_RPC.BENCHMARK_ERROR, benchmarkSignature);
        }
    }

    onBenchmarkStart(benchmarkSignature: string) {
        if (this.socket.connected) {
            console.log(`[AGENT_REMOTE_CLIENT] benchmarkStart(${benchmarkSignature})`);
            this.socket.emit(BEST_RPC.BENCHMARK_START, benchmarkSignature);
            this.emit(BEST_RPC.BENCHMARK_START, benchmarkSignature);
        }
    }

    updateBenchmarkProgress(benchmarkSignature: string, state: BenchmarkUpdateState, opts: BenchmarkRuntimeConfig) {
        if (!this.debounce && this.socket.connected) {
            this.debounce = setTimeout(() => {
                this.debounce = undefined;
                if (this.socket.connected) {
                    console.log(
                        `[AGENT_REMOTE_CLIENT] benchmarkProgress(${benchmarkSignature}) | iterations: ${state.executedIterations}`,
                    );
                    this.socket.emit(BEST_RPC.BENCHMARK_UPDATE, benchmarkSignature, state, opts);
                    this.emit(BEST_RPC.BENCHMARK_UPDATE, benchmarkSignature, state, opts);
                }
            }, 1000);
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

    getId() {
        return `REMOTE_CLIENT_${this.socket.id}`;
    }

    getPendingBenchmarks() {
        return this.pendingBenchmarksToUpload;
    }

    getSpecs() {
        return this.specs;
    }

    getState() {
        return {
            clientId: this.toString(),
            specs: this.specs,
            jobs: this.getPendingBenchmarks(),
            state: this.isIdle() ? AgentState.IDLE : AgentState.BUSY,
        };
    }

    getStatusInfo() {
        return `remining jobs: ${this.pendingBenchmarksToUpload} | specs: ${this.specs} | state: ${this.state}`;
    }

    isBusy() {
        return !this.isIdle();
    }

    isIdle() {
        return this.state === RemoteClientState.IDLE;
    }

    requestJob(): Promise<BuildConfig> {
        if (this.isIdle()) {
            return new Promise((resolve, reject) => {
                this.state = RemoteClientState.REQUESTING_JOB_INFO;
                this.socket.emit(BEST_RPC.BENCHMARK_UPLOAD_REQUEST);
                this._requestJobSuccess = resolve;
                this._requestJobError = reject;
            });
        } else {
            return Promise.reject(`RemoteClient is busy`);
        }
    }

    sendResults(results: any) {
        this.pendingResultsToSend -= 1;
        console.log(`[AGENT_REMOTE_CLIENT] Sending Results | pending: ${this.pendingResultsToSend}`);
        this.socket.emit(BEST_RPC.BENCHMARK_RESULTS, results);
        if (this.pendingBenchmarksToUpload === 0 && this.pendingResultsToSend === 0) {
            this.emit(BEST_RPC.REMOTE_CLIENT_EMPTY_QUEUE);
        }
    }

    toString() {
        return this.getId();
    }
}
