import path from 'path';
import { EventEmitter } from "events";
import { runBenchmark } from '@best/runner';
import BenchmarkTask from "./BenchmarkTask";
import { loadBenchmarkJob } from "./benchmark-loader";
import { x as extractTar } from 'tar';
import * as SocketIO from "socket.io";

export enum RunnerStatus {
    IDLE = 1,
    RUNNING,
}

function initializeForwarder(socket: SocketIO.Socket, logger: Function) {
    return {
        onBenchmarkStart(benchmarkName: string, projectName: string) {
            logger(`STATUS: running_benchmark ${benchmarkName} (${projectName})`);
            socket.emit('running_benchmark_start', benchmarkName, projectName);
        },
        updateBenchmarkProgress(state: any, opts: any) {
            socket.emit('running_benchmark_update', { state, opts });
        },
        onBenchmarkEnd(benchmarkName: string, projectName: string) {
            logger(`STATUS: finished_benchmark ${benchmarkName} (${projectName})`);
            socket.emit('running_benchmark_end', benchmarkName, projectName);
        },
        onBenchmarkError(benchmarkName: string, projectName: string) {
            socket.emit('running_benchmark_error', benchmarkName, projectName);
        },
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
        this.status = RunnerStatus.RUNNING;
        this.runningWasCancelled = false;
        this.runningTask = task;
        this._log = (msg: string) => {
            if (!this.runningWasCancelled) {
                process.stdout.write(`Task[${task.socketConnection.id}] - ${msg}\n`);
            }
        };

        loadBenchmarkJob(task.socketConnection)
            .then(({ uploadDir }: { uploadDir: string }) => {
                const benchmarkName = task.benchmarkName; // this.benchmarkConfig.benchmarkName;
                const benchmarkDirname = path.dirname(uploadDir);

                task.benchmarkEntry = path.join(benchmarkDirname, `${benchmarkName}.html`);

                return extractTar({ cwd: path.dirname(uploadDir), file: uploadDir });
            })
            .then(async () => {
                const { benchmarkName, benchmarkEntry, benchmarkSignature, projectConfig, globalConfig } = task;
                let results;
                let error;
                try {
                    this._log(`Running benchmark ${benchmarkName}`);

                    // @todo: remove this await? i think we can leave it in place and block the thread till the run finishes.
                    results = await runBenchmark(
                        { benchmarkName, benchmarkEntry, benchmarkSignature, projectConfig, globalConfig },
                        initializeForwarder(task.socketConnection, this._log));

                    this._log(`Benchmark ${benchmarkName} completed successfully`);
                } catch (err) {
                    this._log(`Something went wrong while running ${benchmarkName}`);
                    process.stderr.write(err + '\n');
                    error = err;
                } finally {
                    this.afterRunBenchmark(error, results);
                }
                // this._log(`STATUS: ${this.state} (${benchmarkName})`);
            })
            .catch((err: any) => {
                this.afterRunBenchmark(err, null);
            })
    }

    private afterRunBenchmark(err: any, results: any) {
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
