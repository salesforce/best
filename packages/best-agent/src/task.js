import SocketClient from "./socket-client";

const WAITING_FOR_CONFIG = 'waiting_for_config';
const WAITING_FOR_BENCHMARK = 'waiting_for_benchmark';
const RUNNING = 'running';

export default class BenchmarkTask {
    constructor(client) {
        this.state = WAITING_FOR_CONFIG;
        this.client = client;

        client.on(SocketClient.CONFIG_READY, () => this.onBenchmarkConfigReady());
        client.on('disconnect', () => this.abort());
    }

    start() {
        if (this.client.state === SocketClient.CONFIG_READY) {
            const config = this.client.getBenchmarkConfig();
            this.state = WAITING_FOR_BENCHMARK;
            this.client.loadBenchmarks();
        }
    }

    abort() {
        console.log('Abort Task');
    }

    onBenchmarkConfigReady() {
        this.start();
    }

    onBundleReceived(bundle) {
        console.log('Bundle!', bundle);
    }
}
