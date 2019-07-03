import { FrozenGlobalConfig, FrozenProjectConfig, BuildConfig } from '@best/types';
import { BuildOutputStream } from "@best/console-stream";
import { isCI } from '@best/utils';
import workerFarm from "worker-farm";


const DEFAULT_FARM_OPTS = {
    maxConcurrentWorkers: isCI ? 2 : require('os').cpus().length,
    maxConcurrentCallsPerWorker: 1,
};

export async function buildBenchmarks(benchmarks: string[], projectConfig: FrozenProjectConfig, globalConfig: FrozenGlobalConfig, buildLogStream: BuildOutputStream): Promise<BuildConfig[]> {
    const options = Object.assign(
        {},
        DEFAULT_FARM_OPTS,
        {
            onChild: (child: any) => {
                child.on("message", (message: any) => {
                    if (message.type === 'messager.onBenchmarkBuildStart') {
                        buildLogStream.onBenchmarkBuildStart(message.benchmarkPath);
                    } else if (message.type === 'messager.log') {
                        buildLogStream.log(message.message);
                    } else if (message.type === 'messager.onBenchmarkBuildEnd') {
                        buildLogStream.onBenchmarkBuildEnd(message.benchmarkPath);
                    }
                })
            }
        }
    );


    const workers = workerFarm(
        options,
        require.resolve('./build-benchmark-worker')
    );

    const jobs = benchmarks.length;
    let jobsCompleted = 0;
    const benchBuild: BuildConfig[] = [];

    return new Promise((resolve, reject) => {
        benchmarks.forEach(benchmark => {
            const buildInfo = {
                benchmark,
                projectConfig,
                globalConfig
            };

            workers(buildInfo, (err: any, result: BuildConfig) => {
                if (err) {
                    return reject(err);
                }

                benchBuild.push(result);

                if (++jobsCompleted === jobs) {
                    workerFarm.end(workers);
                    resolve(benchBuild);
                }
            });
        });
    });
}
