import path from 'path';
import { EventEmitter } from "events";
import { runBenchmark } from '@best/runner';
import BenchmarkTask from "./BenchmarkTask";
import { loadBenchmarkJob } from "./benchmark-loader";
import { x as extractTar } from 'tar';
import * as SocketIO from "socket.io";
import { RunnerOutputStream } from "@best/console-stream";
import {
    BenchmarkResultsSnapshot,
    BenchmarkResultsState,
    BenchmarkRuntimeConfig
} from "@best/types";

export enum RunnerStatus {
    IDLE = 1,
    RUNNING,
}

// @todo: make a Runner Stream, and add an interface type instead of the class.
function initializeForwarder(socket: SocketIO.Socket, logger: Function): RunnerOutputStream {
    return {
        init() {},
        finish() {},
        onBenchmarkStart(benchmarkPath: string) {
            if (socket.connected) {
                logger(`STATUS: running_benchmark ${benchmarkPath}`);
                socket.emit('running_benchmark_start', benchmarkPath);
            }
        },
        onBenchmarkEnd(benchmarkPath: string) {
            if (socket.connected) {
                logger(`STATUS: finished_benchmark ${benchmarkPath}`);
                socket.emit('running_benchmark_end', benchmarkPath);
            }
        },
        onBenchmarkError(benchmarkPath: string) {
            if (socket.connected) {
                socket.emit('running_benchmark_error', benchmarkPath);
            }
        },
        updateBenchmarkProgress(state: BenchmarkResultsState, opts: BenchmarkRuntimeConfig) {
            if (socket.connected) {
                socket.emit('running_benchmark_update', {state, opts});
            }
        },
    } as RunnerOutputStream;
}

function extractBenchmarkTarFile(task: BenchmarkTask) {
    return ({ uploadDir } : { uploadDir: string }) => {
        const benchmarkName = task.benchmarkName;
        const benchmarkDirname = path.dirname(uploadDir);

        task.benchmarkFolder = benchmarkDirname;
        task.benchmarkEntry = path.join(benchmarkDirname, `${benchmarkName}.html`);

        return extractTar({cwd: benchmarkDirname, file: uploadDir});
    };
}

export default class BenchmarkRunner extends EventEmitter {
    public _status: RunnerStatus = RunnerStatus.IDLE;
    public runningTask: BenchmarkTask | null = null;
    public runningWasCancelled = false;
    private _log: Function = () => {};

    get status() {
        return this._status;
    }

    set status(value: RunnerStatus) {
        if (value !== this._status) {
            this._status = value;
            if (value === RunnerStatus.IDLE) {
                this.emit('idle-runner', this);
            }
        }
    }

    cancelRun(task: BenchmarkTask) {
        if (this.runningTask === task) {
            this._log('Running was cancelled.');
            this.runningWasCancelled = true;
        }
    }

    run(task: BenchmarkTask) {
        if (this.status !== RunnerStatus.IDLE) {
            throw new Error("Trying to run a new benchmark while runner is busy");
        }

        this.status = RunnerStatus.RUNNING;
        this.runningWasCancelled = false;
        this.runningTask = task;
        this._log = (msg: string) => {
            if (!this.runningWasCancelled) {
                process.stdout.write(`Task[${task.socketConnection.id}] - ${msg}\n`);
            }
        };

        // @todo: just to be safe, add timeout in cancel so it waits for the runner to finish or dismiss the run assuming something went wrong
        loadBenchmarkJob(task.socketConnection)
            .then(extractBenchmarkTarFile(task))
            .then(() => this.runBenchmark(task))
            .then(({ error, results }: {error: any, results: any}) => {
                this.afterRunBenchmark(error, results);
            })
            .catch((err: any) => {
                this.afterRunBenchmark(err, null);
            })
    }

    private async runBenchmark(task: BenchmarkTask) {
        const { benchmarkName } = task;
        const messenger = initializeForwarder(task.socketConnection, this._log);

        let results;
        let error;

        try {
            this._log(`Running benchmark ${benchmarkName}`);

            results = await runBenchmark(task.config, messenger);

            this._log(`Benchmark ${benchmarkName} completed successfully`);
        } catch (err) {
            this._log(`Something went wrong while running ${benchmarkName}`);
            process.stderr.write(err + '\n');
            error = err;
        }

        return { error, results }
    }

    private afterRunBenchmark(err: any, results: BenchmarkResultsSnapshot | null) {
        if (!this.runningWasCancelled) {
            this._log(`Sending results to client`);

            if (err) {
                this._log(`Sending error`);
                this.runningTask!.socketConnection.emit('benchmark_error', err.toString());
            } else {
                this._log(`Sending results`);
                this.runningTask!.socketConnection.emit('benchmark_results', results);
            }
        }

        this.runningWasCancelled = false;
        this.runningTask = null;
        this.status = RunnerStatus.IDLE;
    }
}
