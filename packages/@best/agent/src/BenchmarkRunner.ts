import path from 'path';
import { EventEmitter } from "events";
import { runBenchmark } from '@best/runner';
import BenchmarkTask from "./BenchmarkTask";
import { loadBenchmarkJob } from "./benchmark-loader";
import { x as extractTar } from 'tar';
import { RunnerOutputStream } from "@best/console-stream";
import AgentLogger, { loggedSocket, LoggedSocket } from '@best/agent-logger';
import {
    BenchmarkResultsSnapshot,
    BenchmarkResultsState,
    BenchmarkRuntimeConfig
} from "@best/types";

// Maximum time before the agent becomes idle after a job is cancelled (client disconnected)
const CANCEL_TIMEOUT = 30000;

export enum RunnerStatus {
    IDLE = 1,
    RUNNING,
}

// @todo: make a Runner Stream, and add an interface type instead of the class.
function initializeForwarder(socket: LoggedSocket): RunnerOutputStream {
    return {
        init() {},
        finish() {},
        onBenchmarkStart(benchmarkPath: string) {
            if (socket.rawSocket.connected) {
                socket.emit('running_benchmark_start', { entry: benchmarkPath });
            }
        },
        onBenchmarkEnd(benchmarkPath: string) {
            if (socket.rawSocket.connected) {
                socket.emit('running_benchmark_end', { entry: benchmarkPath });
            }
        },
        onBenchmarkError(benchmarkPath: string) {
            if (socket.rawSocket.connected) {
                socket.emit('running_benchmark_error', { entry: benchmarkPath });
            }
        },
        updateBenchmarkProgress(state: BenchmarkResultsState, opts: BenchmarkRuntimeConfig) {
            if (socket.rawSocket.connected) {
                socket.emit('running_benchmark_update', { state, opts });
            }
        },
    } as RunnerOutputStream;
}

function extractBenchmarkTarFile(task: BenchmarkTask) {
    return ({ uploadDir } : { uploadDir: string }) => {
        const benchmarkName = task.benchmarkName;
        const benchmarkDirname = path.dirname(uploadDir);

        task.benchmarkEntry = path.join(benchmarkDirname, `${benchmarkName}.html`);

        return extractTar({ cwd: benchmarkDirname, file: uploadDir });
    };
}

export default class BenchmarkRunner extends EventEmitter {
    public _status: RunnerStatus = RunnerStatus.IDLE;
    public runningTask: BenchmarkTask | null = null;
    public runningWasCancelled = false;
    private cancelledTimeout: any = null;

    private logger: AgentLogger;

    constructor(logger: AgentLogger) {
        super();
        this.logger = logger;
    }

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
            this.logger.event(task.socketConnection.id, 'benchmark_cancel');
            this.runningWasCancelled = true;
            this.cancelledTimeout = setTimeout(() => {
                this.status = RunnerStatus.IDLE;
            }, CANCEL_TIMEOUT)
        }
    }

    run(task: BenchmarkTask) {
        if (this.status !== RunnerStatus.IDLE) {
            throw new Error("Trying to run a new benchmark while runner is busy");
        }

        this.status = RunnerStatus.RUNNING;
        this.runningWasCancelled = false;
        this.runningTask = task;

        // @todo: just to be safe, add timeout in cancel so it waits for the runner to finish or dismiss the run assuming something went wrong
        loadBenchmarkJob(task.socketConnection, this.logger)
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
        const taskSocket = loggedSocket(task.socketConnection, this.logger);
        const messenger = initializeForwarder(taskSocket);

        let results;
        let error;

        try {
            this.logger.info(task.socketConnection.id, 'benchmark start', benchmarkName);

            results = await runBenchmark(task.config, messenger);

            this.logger.info(task.socketConnection.id, 'benchmark completed', benchmarkName);
        } catch (err) {
            this.logger.error(task.socketConnection.id, 'benchmark error', err);
            error = err;
        }

        return { error, results }
    }

    private afterRunBenchmark(err: any, results: BenchmarkResultsSnapshot | null) {
        if (!this.runningWasCancelled) {
            this.logger.info(this.runningTask!.socketConnection.id, 'sending results');

            if (err) {
                this.runningTask!.socketConnection.emit('benchmark_error', err.toString());
            } else {
                this.runningTask!.socketConnection.emit('benchmark_results', results);
                this.logger.event(this.runningTask!.socketConnection.id, 'benchmark results', { resultCount: results!.results.length }, false);
            }
        }

        this.runningWasCancelled = false;
        this.runningTask = null;
        this.status = RunnerStatus.IDLE;
        clearTimeout(this.cancelledTimeout);
    }
}
