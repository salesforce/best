import SocketIOFile from 'socket.io-file';
import EventEmitter from 'events';
import path from 'path';
import { ERROR, BENCHMARK_TASK, DISCONNECT, LOAD_BENCHMARK } from './operations';
import { cacheDirectory } from '@best/utils';
import { x as extractTar } from 'tar';
import * as SocketIO from "socket.io";

const STATE_QUEUED = 'queued';
const STATE_CONFIG_READY = 'config_ready';
const STATE_DISCONNECTED = 'disconnected';
const STATE_LOADING_FILES = 'loading_files';
const STATE_BENCHMARK_READY = 'benchmark_ready';
const STATE_RUNNING = 'benchmark_running';
const STATE_COMPLETED = 'done';

const LOADER_CONFIG = {
    uploadDir: path.join(cacheDirectory('best_agent'), 'uploads'),
    accepts: [],
    maxFileSize: 52428800, // 50 mb
    chunkSize: 10240, // 10kb
    transmissionDelay: 0,
    overwrite: true,
};

function initializeForwarder(config: any, socket: any, logger: any) {
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

class SocketClient extends EventEmitter {
    socket: SocketIO.Socket;
    state: string;
    benchmarkConfig: any;
    _timeout: any;
    static DISCONNECTED: string;
    static CONFIG_READY: any;
    static BENCHMARK_READY: any;

    constructor(socket: SocketIO.Socket) {
        super();
        this.socket = socket;
        this.state = 'init';
        this.benchmarkConfig = null;
        socket.on(DISCONNECT, () => this.disconnectClient());
        socket.on(BENCHMARK_TASK, (data: any) => this.onBenchmarkTaskReceived(data));
        this.setTimeout(5000);
        this._log('STATUS: connected');
    }
    _log(msg: string) {
        process.stdout.write(`Client[${this.socket.id}] - ${msg}\n`);
    }

    setTimeout(t: number) {
        this._timeout = setTimeout(() => this.disconnectClient('timeout - waiting for event'), t);
    }

    getBenchmarkConfig() {
        return this.benchmarkConfig;
    }
    setState(state: any) {
        this._log(`STATUS: ${this.state} => ${state}`);
        this.state = state;
        this.socket.emit('state_change', state);
    }

    disconnectClient(forcedError?: string) {
        if (this.state !== STATE_DISCONNECTED) {
            this.state = STATE_DISCONNECTED;
            if (forcedError) {
                clearTimeout(this._timeout);
                this.socket.disconnect(true);
            }
            this._log(`STATUS: disconnected (${forcedError || 'socket disconnected'})`);
            this.emit(DISCONNECT);
        }
    }

    onBenchmarkTaskReceived(benchmarkConfig: any) {
        clearTimeout(this._timeout);
        // Keys: { benchmarkName, benchmarkSignature, projectConfig, globalConfig } = benchmarkConfig;
        this.benchmarkConfig = benchmarkConfig;
        this.setState(STATE_CONFIG_READY);
        this.emit(STATE_CONFIG_READY);
    }

    hasBenchmarkConfig(): boolean {
        return !!this.benchmarkConfig;
    }

    onLoadedBenchmarks({ uploadDir }: any) {
        extractTar({ cwd: path.dirname(uploadDir), file: uploadDir }).then(() => {
            const benchmarkName = this.benchmarkConfig.benchmarkName;
            const benchmarkDirname = path.dirname(uploadDir);

            this.benchmarkConfig.benchmarkEntry = path.join(benchmarkDirname, `${benchmarkName}.html`);
            this.setState(STATE_BENCHMARK_READY);

            this._log(`STATUS: ${this.state} (${benchmarkName})`);
            this.emit(STATE_BENCHMARK_READY);
        });
    }

    onUploaderError(data: any) {
        this.emit(ERROR, data);
    }

    loadBenchmarks() {
        const uploader = new SocketIOFile(this.socket, LOADER_CONFIG);
        uploader.on('start', () => clearTimeout(this._timeout));
        uploader.on('stream', ({ wrote, size }: any) => this._log(`downloading ${wrote} / ${size}`));
        uploader.on('complete', (info: any) => this.onLoadedBenchmarks(info));
        uploader.on('error', (err: any) => this.onUploaderError(err));
        this.setState(STATE_LOADING_FILES);
        this.socket.emit(LOAD_BENCHMARK);
        this.setTimeout(5000);
    }

    setEnqueued(status: any) {
        this.socket.emit('benchmark_enqueued', status);
        this.setState(STATE_QUEUED);
    }

    setRunning() {
        this.setState(STATE_RUNNING);
    }

    sendBenchmarkResults(err: any, benchmarkResults: any) {
        if (err) {
            this._log(`Sending error`);
            this.socket.emit('benchmark_error', err.toString());
        } else {
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

export default SocketClient;
