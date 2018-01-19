import EventEmitter from 'events';
import SocketClient from './client';
import { runBenchmark } from '@best/runner';

const WAITING_FOR_CONFIG = 'waiting_for_config';
const WAITING_FOR_BENCHMARK = 'waiting_for_benchmark';
const WAITING_FOR_ABORT = 'waiting_for_abort';
const RUNNING = 'running';
const COMPLETED = 'complete';
const CLIENT_DISCONNECTED = 'client_disconnected';

let counter = 0;
export default class BenchmarkTask extends EventEmitter {
    constructor(client) {
        super();
        this.id = ++counter;
        this.state = WAITING_FOR_CONFIG;
        this.client = client;
        client.on(SocketClient.CONFIG_READY, config => this.onBenchmarkConfigReady(config));
        client.on(SocketClient.BENCHMARK_READY, () => this.onBenchmarksReady());
        client.on('disconnect', () => this.onDisconnectedClient());
    }
    _log(msg) {
        console.log(`Task[${this.id}] - ${msg}`);
    }

    start() {
        if (this.client.hasBenchmarkConfig()) {
            this._log('Asking client for benchmark artifacts');
            this.state = WAITING_FOR_BENCHMARK;
            this.client.loadBenchmarks();
        }
    }

    onDisconnectedClient() {
        if (this.state === RUNNING) {
            this._log('Aborting task. Client disconnected while running the task');
            this._log('Benchmark will finish before releasing the task');
            this.state = WAITING_FOR_ABORT;
        }
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
        try {
            this._log(`Running benchmark ${benchmarkName}`);
            const results = await runBenchmark(benchmarkConfig, this.client.getMessager());
            this._log(`Benchmark ${benchmarkName} completed successfully`);
            this.afterRunBenchmark(results);
        } catch (err) {
            this._log(`Something went wrong while running ${benchmarkName}`);
            console.log(err);
            this.client.sendBenchmarkResults(err);
        }
    }

    afterRunBenchmark(results) {
        if (this.state === WAITING_FOR_ABORT) {
            this.state = CLIENT_DISCONNECTED;
            this.emit(COMPLETED);
            return;
        }

        this.state = COMPLETED;
        this._log(`Sending results to client`);
        this.client.sendBenchmarkResults(null, results);
        this.emit(COMPLETED);
    }
}
