import path from 'path';
import fs from 'fs';
import socketIO from 'socket.io-client';
import SocketIOFile from './file-uploader';
import { createTarBundle } from './create-tar';

function proxifyRunner(benchmarkEntryBundle: any, runnerConfig: any, projectConfig: any, globalConfig: any, messager: any) {
    return new Promise(async (resolve, reject) => {
        const { benchmarkName, benchmarkEntry, benchmarkSignature } = benchmarkEntryBundle;
        const { host, options, remoteRunner } = runnerConfig;
        const bundleDirname = path.dirname(benchmarkEntry);
        const remoteProjectConfig = Object.assign({}, projectConfig, {
            benchmarkRunner: remoteRunner,
        });
        const tarBundle = path.resolve(bundleDirname, `${benchmarkName}.tgz`);

        await createTarBundle(bundleDirname, benchmarkName);

        if (!fs.existsSync(tarBundle)) {
            return reject(new Error('Benchmark artifact not found (${tarBundle})'));
        }

        // preRunMessager.print(`Attempting connection with agent at ${host} ...`, process.stdout);
        const socket = socketIO(host, options);

        socket.on('connect', () => {
            // preRunMessager.clear(process.stdout);

            socket.on('load_benchmark', () => {
                const uploader = new SocketIOFile(socket);
                uploader.on('ready', () => {
                    uploader.upload(tarBundle);
                });

                uploader.on('error', (err) => {
                    reject(err);
                });
            });

            socket.on('running_benchmark_start', (benchName: string, projectName: string) => {
                messager.logState(`Running benchmarks remotely...`);
                messager.onBenchmarkStart(benchName, projectName, {
                    displayPath: `${host}/${benchName}`,
                });
            });

            socket.on('running_benchmark_update', ({ state, opts }: any) => {
                messager.updateBenchmarkProgress(state, opts);
            });
            socket.on('running_benchmark_end', (benchName: string, projectName: string) => {
                messager.onBenchmarkEnd(benchName, projectName);
            });

            socket.on('benchmark_enqueued', ({ pending }: any) => {
                messager.logState(`Queued in agent. Pending tasks: ${pending}`);
            });

            socket.on('disconnect', (reason: string) => {
                if (reason === 'io server disconnect') {
                    reject(new Error('Connection terminated'));
                }
            });

            // socket.on('state_change', (s) => {
            //     console.log('>> State change', s);
            // });

            socket.on('error', (err: any) => {
                console.log('> ', err);
                reject(err);
            });

            socket.on('benchmark_error', (err: any) => {
                console.log(err);
                reject(new Error('Benchmark couldn\'t finish running. '));
            });

            socket.on('benchmark_results', ({ results, environment }: any) => {
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

export class Runner {
    run(benchmarkEntryBundle: any, projectConfig: any, globalConfig: any, messager: any) {
        const { benchmarkRunnerConfig } = projectConfig;
        return proxifyRunner(benchmarkEntryBundle, benchmarkRunnerConfig, projectConfig, globalConfig, messager);
    }
}
