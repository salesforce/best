import * as SocketIO from "socket.io";
import ObservableQueue from "./utils/ObservableQueue";
import BenchmarkRunner, { RunnerStatus } from "./BenchmarkRunner";
import BenchmarkTask from "./BenchmarkTask";
import { BuildConfig } from "@best/types";

export class AgentApp {
    private queue: ObservableQueue<BenchmarkTask>;
    private runner: BenchmarkRunner;

    constructor(queue: ObservableQueue<BenchmarkTask>, runner: BenchmarkRunner) {
        this.queue = queue;
        this.runner = runner;

        this.initializeHandlers();
    }

    private initializeHandlers() {
        this.queue.on('item-added', (task: BenchmarkTask) => this.handleJobAddedInQueue(task));
        this.runner.on('idle-runner', (runner: BenchmarkRunner) => this.handleIdleRunner(runner));
    }

    handleIncomingConnection(socket: SocketIO.Socket) {
        socket.on('benchmark_task', (data: BuildConfig) => {
            const task = new BenchmarkTask(data, socket);

            socket.on('disconnect', () => {
                this.queue.remove(task);
                this.runner.cancelRun(task);
            });

            this.queue.push(task);
        });
    }

    private handleJobAddedInQueue(task: BenchmarkTask) {
        if (this.runner.status === RunnerStatus.IDLE) {
            this.queue.remove(task);
            this.runner.run(task);
        } else {
            task.socketConnection.emit('benchmark_enqueued', { pending: this.queue.size });
        }
    }

    private handleIdleRunner(runner: BenchmarkRunner) {
        if (this.queue.size > 0) {
            runner.run(this.queue.pop()!);
        }
    }
}
