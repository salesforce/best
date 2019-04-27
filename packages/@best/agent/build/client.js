"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const socket_io_file_1 = __importDefault(require("socket.io-file"));
const events_1 = __importDefault(require("events"));
const path_1 = __importDefault(require("path"));
const operations_1 = require("./operations");
const utils_1 = require("@best/utils");
const tar_1 = require("tar");
const STATE_QUEUED = 'queued';
const STATE_CONFIG_READY = 'config_ready';
const STATE_DISCONNECTED = 'disconnected';
const STATE_LOADING_FILES = 'loading_files';
const STATE_BENCHMARK_READY = 'benchmark_ready';
const STATE_RUNNING = 'benchmark_running';
const STATE_COMPLETED = 'done';
const LOADER_CONFIG = {
    uploadDir: path_1.default.join(utils_1.cacheDirectory('best_agent'), 'uploads'),
    accepts: [],
    maxFileSize: 52428800,
    chunkSize: 10240,
    transmissionDelay: 0,
    overwrite: true,
};
function initializeForwarder(config, socket, logger) {
    return {
        onBenchmarkStart(benchmarkName, projectName) {
            logger(`STATUS: running_benchmark ${benchmarkName} (${projectName})`);
            socket.emit('running_benchmark_start', benchmarkName, projectName);
        },
        updateBenchmarkProgress(state, opts) {
            socket.emit('running_benchmark_update', { state, opts });
        },
        onBenchmarkEnd(benchmarkName, projectName) {
            logger(`STATUS: finished_benchmark ${benchmarkName} (${projectName})`);
            socket.emit('running_benchmark_end', benchmarkName, projectName);
        },
        onBenchmarkError(benchmarkName, projectName) {
            socket.emit('running_benchmark_error', benchmarkName, projectName);
        },
    };
}
class SocketClient extends events_1.default {
    constructor(socket) {
        super();
        this.socket = socket;
        this.state = 'init';
        this.benchmarkConfig = null;
        socket.on(operations_1.DISCONNECT, () => this.disconnectClient());
        socket.on(operations_1.BENCHMARK_TASK, (data) => this.onBenchmarkTaskReceived(data));
        this.setTimeout(5000);
        this._log('STATUS: connected');
    }
    _log(msg) {
        process.stdout.write(`Client[${this.socket.id}] - ${msg}\n`);
    }
    setTimeout(t) {
        this._timeout = setTimeout(() => this.disconnectClient('timeout - waiting for event'), t);
    }
    getBenchmarkConfig() {
        return this.benchmarkConfig;
    }
    setState(state) {
        this._log(`STATUS: ${this.state} => ${state}`);
        this.state = state;
        this.socket.emit('state_change', state);
    }
    disconnectClient(forcedError) {
        if (this.state !== STATE_DISCONNECTED) {
            this.state = STATE_DISCONNECTED;
            if (forcedError) {
                clearTimeout(this._timeout);
                this.socket.disconnect(true);
            }
            this._log(`STATUS: disconnected (${forcedError || 'socket disconnected'})`);
            this.emit(operations_1.DISCONNECT);
        }
    }
    onBenchmarkTaskReceived(benchmarkConfig) {
        clearTimeout(this._timeout);
        // Keys: { benchmarkName, benchmarkSignature, projectConfig, globalConfig } = benchmarkConfig;
        this.benchmarkConfig = benchmarkConfig;
        this.setState(STATE_CONFIG_READY);
        this.emit(STATE_CONFIG_READY);
    }
    hasBenchmarkConfig() {
        return !!this.benchmarkConfig;
    }
    onLoadedBenchmarks({ uploadDir }) {
        tar_1.x({ cwd: path_1.default.dirname(uploadDir), file: uploadDir }).then(() => {
            const benchmarkName = this.benchmarkConfig.benchmarkName;
            const benchmarkDirname = path_1.default.dirname(uploadDir);
            this.benchmarkConfig.benchmarkEntry = path_1.default.join(benchmarkDirname, `${benchmarkName}.html`);
            this.setState(STATE_BENCHMARK_READY);
            this._log(`STATUS: ${this.state} (${benchmarkName})`);
            this.emit(STATE_BENCHMARK_READY);
        });
    }
    onUploaderError(data) {
        this.emit(operations_1.ERROR, data);
    }
    loadBenchmarks() {
        const uploader = new socket_io_file_1.default(this.socket, LOADER_CONFIG);
        uploader.on('start', () => clearTimeout(this._timeout));
        uploader.on('stream', ({ wrote, size }) => this._log(`downloading ${wrote} / ${size}`));
        uploader.on('complete', (info) => this.onLoadedBenchmarks(info));
        uploader.on('error', (err) => this.onUploaderError(err));
        this.setState(STATE_LOADING_FILES);
        this.socket.emit(operations_1.LOAD_BENCHMARK);
        this.setTimeout(5000);
    }
    setEnqueued(status) {
        this.socket.emit('benchmark_enqueued', status);
        this.setState(STATE_QUEUED);
    }
    setRunning() {
        this.setState(STATE_RUNNING);
    }
    sendBenchmarkResults(err, benchmarkResults) {
        if (err) {
            this._log(`Sending error`);
            this.socket.emit('benchmark_error', err.toString());
        }
        else {
            this._log(`Sending results`);
            this.socket.emit('benchmark_results', benchmarkResults);
        }
        this.setState(STATE_COMPLETED);
    }
    getMessager() {
        return initializeForwarder(this.benchmarkConfig, this.socket, this._log.bind(this));
    }
}
SocketClient.CONFIG_READY = STATE_CONFIG_READY;
SocketClient.BENCHMARK_READY = STATE_BENCHMARK_READY;
SocketClient.DISCONNECTED = STATE_DISCONNECTED;
exports.default = SocketClient;
//# sourceMappingURL=client.js.map