/*
 * Copyright (c) 2019, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: MIT
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/MIT
*/

import AbstractRunner from '@best/runner-abstract';
import WebdriverBrowser from './webdriver';
import { FrozenGlobalConfig,
    FrozenProjectConfig,
    BenchmarkInfo,
    BenchmarkRuntimeConfig,
    BenchmarkResults,
    BenchmarkResultsState,
    BenchmarkResultsSnapshot,
    RunnerStream
} from '@best/types';

declare var BEST: any;
const UPDATE_INTERVAL = 300;


export default class Runner extends AbstractRunner {

    async run(benchmarkInfo: BenchmarkInfo, projectConfig: FrozenProjectConfig, globalConfig: FrozenGlobalConfig, runnerLogStream: RunnerStream): Promise<BenchmarkResultsSnapshot> {
        const { benchmarkEntry } = benchmarkInfo;
        const { useHttp } = projectConfig;

        const runtimeOptions = this.getRuntimeOptions(projectConfig);
        const state = this.initializeBenchmarkState();

        const { url, terminate } = await this.initializeServer(benchmarkEntry, useHttp);
        const browser = new WebdriverBrowser(url, projectConfig);

        try {
            await browser.initialize();
            runnerLogStream.onBenchmarkStart(benchmarkEntry);

            const { results } = await this.runIterations(browser, state, runtimeOptions, runnerLogStream);
            const environment = await this.getEnvironment({ version:browser.version() }, projectConfig, globalConfig);

            return { results, environment, benchmarkInfo, projectConfig };
        } catch (e) {
            runnerLogStream.onBenchmarkError(benchmarkEntry);
            throw e;
        } finally {
            runnerLogStream.onBenchmarkEnd(benchmarkEntry);
            await browser.close();
            terminate();
        }
    }

    initializeBenchmarkState(): BenchmarkResultsState {
        return { executedTime: 0, executedIterations: 0, results: [] };
    }

    async runIterations(browser: WebdriverBrowser, state: BenchmarkResultsState, runtimeOptions: BenchmarkRuntimeConfig, runnnerLogStream: RunnerStream): Promise<BenchmarkResultsState> {
        return runtimeOptions.iterateOnClient
            ? this.runClientIterations(browser, state, runtimeOptions, runnnerLogStream)
            : this.runServerIterations(browser, state, runtimeOptions, runnnerLogStream);
    }

    async runClientIterations(browser: WebdriverBrowser, state: BenchmarkResultsState, runtimeOptions: BenchmarkRuntimeConfig, runnerLogStream: RunnerStream): Promise<BenchmarkResultsState> {
        // Run an iteration to estimate the time it will take
        const testResult = await this.runIteration(browser, { iterations: 1 });
        const estimatedIterationTime = testResult.aggregate;

        const start = Date.now();
        // eslint-disable-next-line lwc/no-set-interval
        const intervalId = setInterval(() => {
            const executing = Date.now() - start;
            state.executedTime = executing;
            state.executedIterations = Math.round(executing / estimatedIterationTime);
            runnerLogStream.updateBenchmarkProgress(state, runtimeOptions);
        }, UPDATE_INTERVAL);

        await browser.reloadPage();
        const { results: [root,] } = await this.runIteration(browser, runtimeOptions);
        state.results.push(root);
        clearInterval(intervalId);

        return state;
    }

    async runServerIterations(browser: WebdriverBrowser, state: BenchmarkResultsState, runtimeOptions: BenchmarkRuntimeConfig, runnnerLogStream: RunnerStream): Promise<BenchmarkResultsState> {
        while (state.executedTime < runtimeOptions.maxDuration || state.executedIterations < runtimeOptions.minSampleCount) {
            const start = Date.now();
            const { results: [root,] } = await this.runIteration(browser, runtimeOptions);
            await browser.reloadPage();
            state.executedTime += Date.now() - start;
            state.executedIterations++;
            if (root) {
                state.results.push(root);
            }
            runnnerLogStream.updateBenchmarkProgress(state, runtimeOptions);
        }

        return state;
    }

    async runIteration(browser: WebdriverBrowser, payload: any): Promise<BenchmarkResults> {
        return browser.evaluate(async (o: any, done: any) => {
            try {
                done(await BEST.runBenchmark(o))
            } catch(e) {
                throw e;
            }
        }, payload);
    }
}
