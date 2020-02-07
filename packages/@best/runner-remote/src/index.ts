/*
 * Copyright (c) 2019, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: MIT
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/MIT
*/

import path from 'path';
import socketIO from 'socket.io-client';
import SocketIOFile from './file-uploader';
import { createTarBundle } from './create-tar';
import AbstractRunner from '@best/runner-abstract';
import { BEST_RPC } from "@best/shared";
import {
    BenchmarkResultsSnapshot,
    FrozenGlobalConfig,
    FrozenProjectConfig,
    RunnerStream,
    BuildConfig,
    BenchmarkResultsState,
    BenchmarkRuntimeConfig
} from "@best/types";

class RemoteRunner {
    private socket: SocketIOClient.Socket;
    private benchmarkBuilds: BuildConfig[];
    private runnerLogStream: RunnerStream;
    private benchmarkResults: BenchmarkResultsSnapshot[] = [];
    private uploadingBenchmark: boolean = false;
    private _onBenchmarkError: Function = function (err: any) { throw new Error(err); };
    private _onBenchmarksRunSuccess: Function = function () {};

    constructor(socket: SocketIOClient.Socket, benchmarksBuilds: BuildConfig[], runnerLogStream: RunnerStream) {
        this.socket = socket;
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

        this.uploadingBenchmark = true;

        this.socket.emit(BEST_RPC.BENCHMARK_UPLOAD_RESPONSE, benchmarkConfig, async (entry: string) => {
            const { benchmarkName, benchmarkEntry } = benchmarkConfig;
            const bundleDirname = path.dirname(benchmarkEntry);
            const tarBundle = path.resolve(bundleDirname, `${benchmarkName}.tgz`);

            try {
                await createTarBundle(bundleDirname, benchmarkName);
            } catch(err) {
                return this.triggerBenchmarkError(err);
            }

            const uploader = new SocketIOFile(this.socket);
            uploader.on('ready', () => uploader.upload(tarBundle));
            uploader.on('error', (err) => this.triggerBenchmarkError(err));
            uploader.on('complete', () => this.uploadingBenchmark = false);
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

export class Runner extends AbstractRunner {
    run(benchmarkBuilds: BuildConfig[], projectConfig: FrozenProjectConfig, globalConfig: FrozenGlobalConfig, runnerLogStream: RunnerStream): Promise<BenchmarkResultsSnapshot[]> {
        return new Promise((resolve, reject) => {
            const { uri, options, specs } = projectConfig.benchmarkRunnerConfig;

            const socketOptions = {
                path: '/best',
                reconnection: false,
                query: {
                    ...options,
                    specs: JSON.stringify(specs),
                    jobs: benchmarkBuilds.length
                }
            };

            const socket = socketIO(uri, socketOptions);
            const benchmarkQueue = benchmarkBuilds.slice();

            const remoteRunner = new RemoteRunner(socket, benchmarkQueue, runnerLogStream);
            remoteRunner.onBenchmarkError(reject);
            remoteRunner.onBenchmarksRunSuccess(resolve);
        });
    }
}
