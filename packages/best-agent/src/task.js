import EventEmitter from 'events';
import SocketClient from './client';
import { runBenchmark } from '@best/runner';
import { ERROR } from './operations';

const WAITING_FOR_CONFIG = 'waiting_for_config';
const WAITING_FOR_BENCHMARK = 'waiting_for_benchmark';
const WAITING_FOR_ABORT = 'waiting_for_abort';
const RUNNING = 'running';
const COMPLETED = 'complete';

let counter = 0;
export default class BenchmarkTask extends EventEmitter {
    constructor(client) {
        super();
        this.id = ++counter;
        this.state = WAITING_FOR_CONFIG;
        this.client = client;
        client.on(SocketClient.CONFIG_READY, config => this.onBenchmarkConfigReady(config));
        client.on(SocketClient.BENCHMARK_READY, () => this.onBenchmarksReady());
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
        console.log('Stack trace: ', err);
        this.emit(ERROR, err);
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
            results = await runBenchmark(benchmarkConfig, this.client.getMessager());
            this._log(`Benchmark ${benchmarkName} completed successfully`);
        } catch (err) {
            this._log(`Something went wrong while running ${benchmarkName}`);
            process.stderr.write(err + '\n');
            error = err;
        } finally {
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
