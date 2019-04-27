"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const socket_io_client_1 = __importDefault(require("socket.io-client"));
const file_uploader_1 = __importDefault(require("./file-uploader"));
const create_tar_1 = require("./create-tar");
const messager_1 = require("@best/messager");
function proxifyRunner(benchmarkEntryBundle, runnerConfig, projectConfig, globalConfig, messager) {
    return new Promise(async (resolve, reject) => {
        const { benchmarkName, benchmarkEntry, benchmarkSignature } = benchmarkEntryBundle;
        const { host, options, remoteRunner } = runnerConfig;
        const bundleDirname = path_1.default.dirname(benchmarkEntry);
        const remoteProjectConfig = Object.assign({}, projectConfig, {
            benchmarkRunner: remoteRunner,
        });
        const tarBundle = path_1.default.resolve(bundleDirname, `${benchmarkName}.tgz`);
        await create_tar_1.createTarBundle(bundleDirname, benchmarkName);
        if (!fs_1.default.existsSync(tarBundle)) {
            return reject(new Error('Benchmark artifact not found (${tarBundle})'));
        }
        messager_1.preRunMessager.print(`Attempting connection with agent at ${host} ...`, process.stdout);
        const socket = socket_io_client_1.default(host, options);
        socket.on('connect', () => {
            messager_1.preRunMessager.clear(process.stdout);
            socket.on('load_benchmark', () => {
                const uploader = new file_uploader_1.default(socket);
                uploader.on('ready', () => {
                    uploader.upload(tarBundle);
                });
                uploader.on('error', (err) => {
                    reject(err);
                });
            });
            socket.on('running_benchmark_start', (benchName, projectName) => {
                messager.logState(`Running benchmarks remotely...`);
                messager.onBenchmarkStart(benchName, projectName, {
                    displayPath: `${host}/${benchName}`,
                });
            });
            socket.on('running_benchmark_update', ({ state, opts }) => {
                messager.updateBenchmarkProgress(state, opts);
            });
            socket.on('running_benchmark_end', (benchName, projectName) => {
                messager.onBenchmarkEnd(benchName, projectName);
            });
            socket.on('benchmark_enqueued', ({ pending }) => {
                messager.logState(`Queued in agent. Pending tasks: ${pending}`);
            });
            socket.on('disconnect', (reason) => {
                if (reason === 'io server disconnect') {
                    reject(new Error('Connection terminated'));
                }
            });
            // socket.on('state_change', (s) => {
            //     console.log('>> State change', s);
            // });
            socket.on('error', (err) => {
                console.log('> ', err);
                reject(err);
            });
            socket.on('benchmark_error', (err) => {
                console.log(err);
                reject(new Error('Benchmark couldn\'t finish running. '));
            });
            socket.on('benchmark_results', ({ results, environment }) => {
                socket.disconnect();
                resolve({ results, environment });
            });
            socket.emit('benchmark_task', {
                benchmarkName,
                benchmarkSignature,
                projectConfig: remoteProjectConfig,
                globalConfig,
            });
        });
        return true;
    });
}
class Runner {
    run(benchmarkEntryBundle, projectConfig, globalConfig, messager) {
        const { benchmarkRunnerConfig } = projectConfig;
        return proxifyRunner(benchmarkEntryBundle, benchmarkRunnerConfig, projectConfig, globalConfig, messager);
    }
}
exports.Runner = Runner;
//# sourceMappingURL=index.js.map