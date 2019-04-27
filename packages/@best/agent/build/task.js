"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const events_1 = __importDefault(require("events"));
const client_1 = __importDefault(require("./client"));
const runner_1 = require("@best/runner");
const operations_1 = require("./operations");
const WAITING_FOR_CONFIG = 'waiting_for_config';
const WAITING_FOR_BENCHMARK = 'waiting_for_benchmark';
const WAITING_FOR_ABORT = 'waiting_for_abort';
const RUNNING = 'running';
const COMPLETED = 'complete';
let counter = 0;
class BenchmarkTask extends events_1.default {
    constructor(client) {
        super();
        this.id = ++counter;
        this.state = WAITING_FOR_CONFIG;
        this.client = client;
        client.on(client_1.default.CONFIG_READY, () => this.onBenchmarkConfigReady());
        client.on(client_1.default.BENCHMARK_READY, () => this.onBenchmarksReady());
        client.on('disconnect', () => this.onClientDisconnected());
        client.on('error', (err) => this.onClientError(err));
    }
    _log(msg) {
        process.stdout.write(`Task[${this.id}] - ${msg}\n`);
    }
    start() {
        if (this.client.hasBenchmarkConfig()) {
            this._log('Asking client for benchmark artifacts');
            this.state = WAITING_FOR_BENCHMARK;
            this.client.loadBenchmarks();
        }
    }
    onClientDisconnected() {
        if (this.state === RUNNING) {
            this._log('Aborting task. Client disconnected while running the task');
            this._log('Benchmark will finish before releasing the task');
            this.state = WAITING_FOR_ABORT;
        }
    }
    onClientError(err) {
        this._log('Error running task:' + err.toString());
        // console.log('Stack trace: ', err);
        this.emit(operations_1.ERROR, err);
    }
    onBenchmarkConfigReady() {
        this.start();
    }
    onBenchmarksReady() {
        this.client.setRunning();
        this.runBenchmarkTask(this.client.getBenchmarkConfig());
    }
    async runBenchmarkTask(benchmarkConfig) {
        this.state = RUNNING;
        const { benchmarkName } = benchmarkConfig;
        let results;
        let error;
        try {
            this._log(`Running benchmark ${benchmarkName}`);
            results = await runner_1.runBenchmark(benchmarkConfig, this.client.getMessager());
            this._log(`Benchmark ${benchmarkName} completed successfully`);
        }
        catch (err) {
            this._log(`Something went wrong while running ${benchmarkName}`);
            process.stderr.write(err + '\n');
            error = err;
        }
        finally {
            this.afterRunBenchmark(error, results);
        }
    }
    afterRunBenchmark(error, results) {
        this.state = COMPLETED;
        this._log(`Sending results to client`);
        this.client.sendBenchmarkResults(error, results);
        this.emit(COMPLETED);
    }
}
exports.default = BenchmarkTask;
//# sourceMappingURL=task.js.map