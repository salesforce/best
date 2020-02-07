/*
 * Copyright (c) 2019, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: MIT
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/MIT
*/

import path from 'path';
import fs from 'fs';
import socketIO from 'socket.io-client';
import SocketIOFile from './file-uploader';
import { createTarBundle } from './create-tar';
import AbstractRunner from '@best/runner-abstract';
import { BEST_RPC } from "@best/shared";
import {
    BenchmarkInfo,
    BenchmarkResultsSnapshot,
    BenchmarkResultsState,
    BenchmarkRuntimeConfig,
    FrozenGlobalConfig,
    FrozenProjectConfig,
    RunnerStream,
    BuildConfig
} from "@best/types";

export function proxifyRunner(benchmarkEntryBundle: BenchmarkInfo, projectConfig: FrozenProjectConfig, globalConfig: FrozenGlobalConfig, messager: RunnerStream) : Promise<BenchmarkResultsSnapshot> {
    return new Promise(async (resolve, reject) => {
        const { benchmarkName, benchmarkEntry, benchmarkFolder, benchmarkSignature } = benchmarkEntryBundle;
        const { host, options, remoteRunner } = projectConfig.benchmarkRunnerConfig;
        const bundleDirname = path.dirname(benchmarkEntry);
        const remoteProjectConfig = Object.assign({}, projectConfig, {
            benchmarkRunner: remoteRunner,
        });
        const tarBundle = path.resolve(bundleDirname, `${benchmarkName}.tgz`);

        await createTarBundle(bundleDirname, benchmarkName);

        if (!fs.existsSync(tarBundle)) {
            return reject(new Error('Benchmark artifact not found (${tarBundle})'));
        }

        const normalizedSocketOptions = {
            path: '/best',
            ...options
        }

        const socket = socketIO(host, normalizedSocketOptions);

        socket.on('connect_error', (err: any) => {
            console.log('Error in connection to agent > ', err);
            reject(err);
        });

        socket.on('error', (err: any) => {
            console.log('Error in connection to agent > ', err);
            reject(err);
        });

        socket.on('connect', () => {
            socket.on('load_benchmark', () => {
                const uploader = new SocketIOFile(socket);
                uploader.on('ready', () => {
                    uploader.upload(tarBundle);
                });

                uploader.on('error', (err) => {
                    reject(err);
                });
            });

            socket.on('running_benchmark_start', () => {
                messager.log(`Running benchmarks remotely...`);
                messager.onBenchmarkStart(benchmarkEntry);
            });

            socket.on('running_benchmark_update', ({ state, opts }: { state: BenchmarkResultsState, opts: BenchmarkRuntimeConfig }) => {
                messager.updateBenchmarkProgress(benchmarkEntry, state, opts);
            });

            socket.on('running_benchmark_end', () => {
                messager.onBenchmarkEnd(benchmarkEntry);
            });

            socket.on('benchmark_enqueued', ({ pending }: { pending: number }) => {
                messager.log(`Queued in agent. Pending tasks: ${pending}`);
            });

            socket.on('disconnect', (reason: string) => {
                if (reason === 'io server disconnect') {
                    reject(new Error('Connection terminated'));
                }
            });

            socket.on('benchmark_error', (err: any) => {
                console.log(err);
                reject(new Error('Benchmark couldn\'t finish running. '));
            });

            socket.on('benchmark_results', (result: BenchmarkResultsSnapshot) => {
                socket.disconnect();
                resolve(result);
            });

            socket.emit('benchmark_task', {
                benchmarkName,
                benchmarkFolder,
                benchmarkSignature,
                projectConfig: remoteProjectConfig,
                globalConfig,
            });
        });

        return true;
    });
}

class RemoteRunner {
    private socket: SocketIOClient.Socket;
    private benchmarkBuilds: BuildConfig[];
    private _onBenchmarkError: Function = function (err: any) { throw new Error(err); };
    private _onBenchmarksRunSuccess: Function = function () {};

    constructor(socket: SocketIOClient.Socket, benchmarksBuilds: BuildConfig[]) {
        this.socket = socket;
        this.benchmarkBuilds = benchmarksBuilds;

        Object.keys(BEST_RPC).forEach((key) => {
            const methodName = (BEST_RPC as any)[key];
            this.socket.on(methodName, (this as any)[methodName].bind(this));
        });
    }

    _DELETEME() {
        console.log(this.benchmarkBuilds, this._onBenchmarksRunSuccess);
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

    [BEST_RPC.BENCHMARK_UPLOAD_INFO]() {
        console.log('benchmark_upload_info');
    }

    [BEST_RPC.BENCHMARK_UPLOAD_REQUEST]() {
        const benchmarkConfig = this.benchmarkBuilds.shift();
        if (!benchmarkConfig) {
            this.triggerBenchmarkError('Agent is requesting more jobs than specified');
        }

        this.socket.emit(BEST_RPC.BENCHMARK_UPLOAD_INFO, benchmarkConfig);
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

    triggerBenchmarkError(error_msg: any) {
        this._onBenchmarkError(new Error(error_msg));
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

            const remoteRunner = new RemoteRunner(socket, benchmarkQueue);
            remoteRunner.onBenchmarkError(reject);
            remoteRunner.onBenchmarksRunSuccess(resolve);
        });
    }
}
