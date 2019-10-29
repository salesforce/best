/*
 * Copyright (c) 2019, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: MIT
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/MIT
*/

import { FrozenGlobalConfig, FrozenProjectConfig, BuildConfig } from '@best/types';
import { BuildOutputStream } from "@best/console-stream";
import { isCI } from '@best/utils';
import workerFarm from "worker-farm";
import { buildBenchmark } from "./build-benchmark"

const DEFAULT_FARM_OPTS = {
    maxConcurrentWorkers: isCI ? 2 : require('os').cpus().length,
    maxConcurrentCallsPerWorker: 1,
};

interface ChildMessage { type: string, benchmarkPath: string, message: string }

async function runInBand(benchmarks: string[], projectConfig: FrozenProjectConfig, globalConfig: FrozenGlobalConfig, buildLogStream: BuildOutputStream): Promise<BuildConfig[]> {
    const benchmarkResults: BuildConfig[] = [];
    for (const benchmark of benchmarks) {
        const result = await buildBenchmark(benchmark,projectConfig, globalConfig, buildLogStream);
        benchmarkResults.push(result);
    }

    return benchmarkResults;
}

function runInWorkers(benchmarks: string[], projectConfig: FrozenProjectConfig, globalConfig: FrozenGlobalConfig, buildLogStream: BuildOutputStream): Promise<BuildConfig[]> {
    const opts = {
        ...DEFAULT_FARM_OPTS,
        onChild: (child: NodeJS.Process) => {
            child.on("message", (message: ChildMessage) => {
                if (message.type === 'messager.onBenchmarkBuildStart') {
                    buildLogStream.onBenchmarkBuildStart(message.benchmarkPath);
                } else if (message.type === 'messager.log') {
                    buildLogStream.log(message.message);
                } else if (message.type === 'messager.onBenchmarkBuildEnd') {
                    buildLogStream.onBenchmarkBuildEnd(message.benchmarkPath);
                }
            })
        }
    };

    const workers = workerFarm(opts, require.resolve('./build-benchmark-worker'));
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

export function buildBenchmarks(benchmarks: string[], projectConfig: FrozenProjectConfig, globalConfig: FrozenGlobalConfig, buildLogStream: BuildOutputStream): Promise<BuildConfig[]> {
    if (globalConfig.runInBand) {
        return runInBand(benchmarks, projectConfig, globalConfig, buildLogStream);
    } else {
        return runInWorkers(benchmarks, projectConfig, globalConfig, buildLogStream);
    }
}
