import path from 'path';
import fs from 'fs';
import socketIO from 'socket.io-client';
import SocketIOFile from './file-uploader';
import { createTarBundle } from './create-tar';
import { preRunMessager } from '@best/messager';

function proxifyRunner(benchmarkEntryBundle, runnerConfig, projectConfig, globalConfig, messager) {
    return new Promise(async (resolve, reject) => {
        const { benchmarkName, benchmarkEntry, benchmarkSignature } = benchmarkEntryBundle;
        const { host, options, remoteRunner } = runnerConfig;
        const bundleDirname = path.dirname(benchmarkEntry);
        const remoteprojectConfig = Object.assign({}, projectConfig, {
            benchmarkRunner: remoteRunner,
        });
        const tarBundle = path.resolve(bundleDirname, `${benchmarkName}.tgz`);

        await createTarBundle(bundleDirname, benchmarkName);

        if (!fs.existsSync(tarBundle)) {
            return reject(new Error('Benchmark artifact not found (${tarBundle})'));
        }

        preRunMessager.print(`Attempting connection with agent at ${host} ...`, process.stdout);
        const socket = socketIO(host, options);

        socket.on('connect', () => {
            preRunMessager.clear(process.stdout);

            socket.on('load_benchmark', () => {
                const uploader = new SocketIOFile(socket);
                uploader.on('ready', () => {
                    uploader.upload(tarBundle);
                });
            });

            socket.on('running_benchmark_start', (benchName, projectName) => {
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

            // socket.on('disconnect', (s) => {
            //     console.log('Disconnected??');
            // });

            // socket.on('state_change', (s) => {
            //     console.log('>> State change', s);
            // });

            socket.on('benchmark_error', err => {
                socket.disconnect();
                reject(err);
            });

            socket.on('benchmark_results', ({ results, environment }) => {
                socket.disconnect();
                resolve({ results, environment });
            });

            socket.emit('benchmark_task', {
                benchmarkName,
                benchmarkSignature,
                projectConfig: remoteprojectConfig,
                globalConfig,
            });
        });

        return true;
    });
}

export function run(benchmarkEntryBundle, projectConfig, globalConfig, messager) {
    const { benchmarkRunnerConfig } = projectConfig;
    return proxifyRunner(benchmarkEntryBundle, benchmarkRunnerConfig, projectConfig, globalConfig, messager);
}
