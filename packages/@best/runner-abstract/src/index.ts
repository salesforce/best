/*
 * Copyright (c) 2019, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: MIT
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/MIT
*/

import { dirname, basename } from 'path';
import express from 'express';
import { getSystemInfo } from '@best/utils';
import {
    FrozenGlobalConfig,
    FrozenProjectConfig,
    BenchmarkRuntimeConfig,
    BenchmarkResultsSnapshot,
    BrowserSpec,
    EnvironmentConfig,
    BuildConfig,
    RunnerStream
} from '@best/types';

export default abstract class AbstractRunner {
    abstract async run(benchmarkBuilds: BuildConfig[], projectConfig: FrozenProjectConfig, globalConfig: FrozenGlobalConfig, runnerLogStream: RunnerStream): Promise<BenchmarkResultsSnapshot[]>;

    static async getBrowserSpecs(): Promise<BrowserSpec[]> {
        throw new Error('Runner must implement getBrowserSpecs');
    }

    static isRemote: boolean = false;

    initializeServer(benchmarkEntry: string, useHttp: boolean): Promise<{ terminate:Function, url: string }> {
        if (!useHttp) {
            return Promise.resolve({ url: `file://${benchmarkEntry}`, terminate: () => {}});
        }

        return new Promise((resolve) => {
            const app = express();
            app.use(express.static(dirname(benchmarkEntry)));
            const server = app.listen(() => {
                const { port }: any = server.address();
                resolve({
                    url: `http://127.0.0.1:${port}/${basename(benchmarkEntry)}`,
                    terminate: () => { server.close(); }
                });
            });
        });
    }

    getRuntimeOptions(projectConfig: FrozenProjectConfig): BenchmarkRuntimeConfig {
        const { benchmarkIterations, benchmarkOnClient, benchmarkMaxDuration, benchmarkMinIterations } = projectConfig;
        const definedIterations = Number.isInteger(benchmarkIterations);

        // For benchmarking on the client or a defined number of iterations duration is irrelevant
        const maxDuration = definedIterations ? 1 : benchmarkMaxDuration;
        const minSampleCount = definedIterations ? benchmarkIterations : benchmarkMinIterations;

        return {
            maxDuration,
            minSampleCount,
            iterations: benchmarkIterations,
            iterateOnClient: benchmarkOnClient,
        };
    }

    async getEnvironment(browser: BrowserSpec, projectConfig: FrozenProjectConfig, globalConfig: FrozenGlobalConfig): Promise<EnvironmentConfig> {
        const { system, cpu, os, load } = await getSystemInfo();
        const {
            benchmarkOnClient,
            benchmarkRunner,
            benchmarkEnvironment,
            benchmarkIterations,
            projectName,
        } = projectConfig;

        return {
            hardware: { system, cpu, os },
            container: { load },
            browser,
            configuration: {
                project: {
                    projectName,
                    benchmarkOnClient,
                    benchmarkRunner,
                    benchmarkEnvironment,
                    benchmarkIterations,
                },
                global: {
                    gitCommitHash: globalConfig.gitInfo.lastCommit.hash,
                    gitHasLocalChanges: globalConfig.gitInfo.localChanges,
                    gitBranch: globalConfig.gitInfo.branch,
                    gitRepository: globalConfig.gitInfo.repo,
                },
            },
        };
    }
}
