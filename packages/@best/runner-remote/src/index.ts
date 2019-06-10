import path from 'path';
import fs from 'fs';
import socketIO from 'socket.io-client';
import { createTarBundle } from './create-tar';
import { preRunMessager } from '@best/messager';
import RemoteAgent from "./RemoteAgent";

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

        preRunMessager.print(`Attempting connection with agent at ${host} ...`, process.stdout);
        const socket = socketIO(host, options);

        socket.on('connect', () => {
            preRunMessager.clear(process.stdout);

            const remoteAgent: RemoteAgent = new RemoteAgent(socket);

            remoteAgent.on('running_benchmark_start', (benchName: string, projectName: string) => {
                messager.logState(`Running benchmarks remotely...`);
                messager.onBenchmarkStart(benchName, projectName, {
                    displayPath: `${host}/${benchName}`,
                });
            });

            remoteAgent.on('running_benchmark_update', ({ state, opts }: any) => {
                messager.updateBenchmarkProgress(state, opts);
            });
            remoteAgent.on('running_benchmark_end', (benchName: string, projectName: string) => {
                messager.onBenchmarkEnd(benchName, projectName);
            });

            remoteAgent.on('benchmark_enqueued', ({ pending }: any) => {
                messager.logState(`Queued in agent. Pending tasks: ${pending}`);
            });

            socket.on('disconnect', (reason: string) => {
                if (reason === 'io server disconnect') {
                    reject(new Error('Connection terminated'));
                }
            });

            remoteAgent.on('error', (err: any) => {
                console.log('> ', err);
                reject(err);
            });

            remoteAgent.on('benchmark_error', (err: any) => {
                console.log(err);
                reject(new Error('Benchmark couldn\'t finish running. '));
            });

            remoteAgent.on('benchmark_results', ({ results, environment }: any) => {
                socket.disconnect();
                resolve({ results, environment });
            });

            remoteAgent.runBenchmark({
                tarBundle,
                benchmarkName,
                benchmarkSignature,
                projectConfig: remoteProjectConfig,
                globalConfig,
            });
        });

        return true;
    });
}

export { default as RemoteAgent } from './RemoteAgent';

export class Runner {
    run(benchmarkEntryBundle: any, projectConfig: any, globalConfig: any, messager: any) {
        const { benchmarkRunnerConfig } = projectConfig;
        return proxifyRunner(benchmarkEntryBundle, benchmarkRunnerConfig, projectConfig, globalConfig, messager);
    }
}
