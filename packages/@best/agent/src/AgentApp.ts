/*
 * Copyright (c) 2019, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: MIT
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/MIT
*/

import * as SocketIO from "socket.io";
import ObservableQueue from "./utils/ObservableQueue";
import BenchmarkRunner, { RunnerStatus } from "./BenchmarkRunner";
import BenchmarkTask from "./BenchmarkTask";
import { BuildConfig } from "@best/types";
import AgentLogger from '@best/agent-logger';
import { EventEmitter } from 'events';

export class AgentApp extends EventEmitter {
    private queue: ObservableQueue<BenchmarkTask>;
    private runner: BenchmarkRunner;
    public logger: AgentLogger;
    public socketServer: SocketIO.Server

    constructor(socketServer: SocketIO.Server, queue: ObservableQueue<BenchmarkTask>, runner: BenchmarkRunner, logger: AgentLogger) {
        super();
        this.queue = queue;
        this.runner = runner;
        this.logger = logger;
        this.socketServer = socketServer;

        this.initializeHandlers();
    }

    private initializeHandlers() {
        this.queue.on('item-added', (task: BenchmarkTask) => this.handleJobAddedInQueue(task));
        this.runner.on('idle-runner', (runner: BenchmarkRunner) => this.handleIdleRunner(runner));
        this.socketServer.on('connect', (socket: SocketIO.Socket) => {
            this.handleIncomingConnection(socket);
        });
    }

    async handleIncomingConnection(socket: SocketIO.Socket) {
        socket.on('benchmark_task', (data: BuildConfig) => {
            const task = new BenchmarkTask(data, socket);
            this.logger.event(socket.id, 'benchmark added', { benchmarkName: data.benchmarkName }, false);

            socket.on('disconnect', () => {
                this.queue.remove(task);
                this.runner.cancelRun(task);
            });

            this.queue.push(task);
        });

        const specs = await this.runner.getRunnerBrowserSpecs();
        this.logger.event(socket.id, 'specs update', specs);
    }

    private handleJobAddedInQueue(task: BenchmarkTask) {
        if (this.runner.status === RunnerStatus.IDLE) {
            this.queue.remove(task);
            this.runner.run(task);
        } else {
            task.socketConnection.emit('benchmark_enqueued', { pending: this.queue.size });
            this.logger.event(task.socketConnection.id, 'benchmark queued', { pending: this.queue.size });
        }
    }

    private handleIdleRunner(runner: BenchmarkRunner) {
        if (this.queue.size > 0) {
            runner.run(this.queue.pop()!);
        }
    }
}
