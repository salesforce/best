import * as SocketIO from "socket.io";
import ObservableQueue from "./utils/ObservableQueue";
import BenchmarkRunner, { RunnerStatus } from "./BenchmarkRunner";
import BenchmarkTask from "./BenchmarkTask";

export class AgentApp {
    private queue: ObservableQueue<BenchmarkTask>;
    private runner: BenchmarkRunner;

    constructor(queue: ObservableQueue<BenchmarkTask>, runner: BenchmarkRunner) {
        this.queue = queue;
        this.runner = runner;

        this.initializeHandlers();
    }

    private initializeHandlers() {
        this.queue.on('task-added', (task: BenchmarkTask) => this.handleJobAddedInQueue(task));
        this.runner.on('idle-runner', (runner: BenchmarkRunner) => this.handleIdleRunner(runner));
    }

    handleIncomingConnection(socket: SocketIO.Socket) {
        // In the original implementation, it has a timeout for this connection waiting for the benchmark_task. @todo: implement this timeout functionality via weakmap[
        socket.on('benchmark_task', (data: any) => {
            const { benchmarkName, benchmarkSignature, projectConfig, globalConfig }
                : { benchmarkName: string, benchmarkSignature: string, projectConfig: any, globalConfig: any } = data;

            const task = new BenchmarkTask({
                benchmarkName,
                benchmarkSignature,
                projectConfig,
                globalConfig,
                socket
            });

            socket.on('disconnect', () => {
                this.queue.remove(task);
                // @todo: check if is the running job and cancel
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
