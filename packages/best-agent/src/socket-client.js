import SocketIOFile from "socket.io-file";
import EventEmitter from "events";
import { BENCHMARK_TASK, DISCONNECT, LOAD_BENCHMARKS } from "./operations";

const STATE_QUEUED = 'queued';
const STATE_CONFIG_READY = 'config_ready';
const STATE_DISCONNECTED = 'disconnected';
const STATE_LOADING_FILES = 'loading_files';
const STATE_BENCHMARKS_READY = 'benchmarks_ready';

const LOADER_CONFIG = {
    uploadDir: 'test_data',
    accepts: [],
    maxFileSize: 4194304,
    chunkSize: 10240, // 1kb
    transmissionDelay: 0,
    overwrite: true
};


class SocketClient extends EventEmitter {
    constructor(socket) {
        super();
        this.socket = socket;
        this.state = STATE_QUEUED;
        this.benchmarkConfig = null;
        socket.on(DISCONNECT, () => this.disconnectClient());
        socket.on(BENCHMARK_TASK, (data) => this.onBenchmarkTaskReceived(data));
        this.setTimeout(5000);
        console.log(`Client: ${socket.id} | STATUS: connected`);
    }

    setTimeout(t) {
        this._timeout = setTimeout(() => this.disconnectClient('timeout - waiting for event'), t);
    }

    getBenchmarkConfig() {
        return this.benchmarkConfig;
    }
    setState(state) {
        console.log(`Client[${this.socket.id}] | STATUS: ${this.state} => ${state}`);
        this.state = state;
    }

    disconnectClient(forcedError) {
        if (this.state !== STATE_DISCONNECTED) {
            this.state = STATE_DISCONNECTED;
            if (forcedError) {
                clearTimeout(this._timeout);
                this.socket.disconnect(true);
            }
            this.emit(DISCONNECT);
            console.log(`Client: ${this.socket.id} | STATUS: disconnected (${forcedError || 'socket disconnected'})`);
        }
    }

    onBenchmarkTaskReceived(benchmarkConfig) {
        clearTimeout(this._timeout);
        this.benchmarkConfig = benchmarkConfig;
        this.setState(STATE_CONFIG_READY);
        this.emit(STATE_CONFIG_READY);
    }
    onLoadedBenchmarks() {
        this.state = STATE_BENCHMARKS_READY;
    }

    loadBenchmarks() {
        const uploader = new SocketIOFile(this.socket, LOADER_CONFIG);
        uploader.on('start', () => clearTimeout(this._timeout));
        uploader.on('stream', ({ wrote, size }) => console.log(`${wrote} / ${size} byte(s)`));
        uploader.on('complete', () => this.onLoadedBenchmarks());
        this.state = this.setState(STATE_LOADING_FILES);
        this.emit(LOAD_BENCHMARKS);
        this.setTimeout(5000);
    }

    notifyEnqueued() {
        this.socket.emit('enqueued');
    }

    notifyRunning() {
        this.socket.emit('running');
    }
}

SocketClient.CONFIG_READY = STATE_CONFIG_READY;
SocketClient.QUEUED = STATE_QUEUED;
SocketClient.DISCONNECTED = STATE_DISCONNECTED;

export default SocketClient;
