/*
 * Copyright (c) 2019, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: MIT
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/MIT
 */

import {
    FrozenGlobalConfig,
    FrozenProjectConfig,
    BuildConfig,
    BenchmarkRuntimeConfig,
    BenchmarkResults,
    BenchmarkResultsState,
    BenchmarkResultsSnapshot,
    Interruption,
} from '@best/types';
import AbstractRunner from '@best/runner-abstract';
import HeadlessBrowser from './headless';
import { RunnerStream } from '@best/types';

declare var BEST: any;
const UPDATE_INTERVAL = 300;

export default class Runner extends AbstractRunner {
    async run(
        benchmarkBuilds: BuildConfig[],
        projectConfig: FrozenProjectConfig,
        globalConfig: FrozenGlobalConfig,
        runnerLogStream: RunnerStream,
        interruption?: Interruption,
    ): Promise<BenchmarkResultsSnapshot[]> {
        const snapshotResults: BenchmarkResultsSnapshot[] = [];
        for (const benchmarkInfo of benchmarkBuilds) {
            const { benchmarkEntry, benchmarkRemoteEntry, benchmarkSignature } = benchmarkInfo;
            const runtimeOptions = this.getRuntimeOptions(projectConfig);
            const state = this.initializeBenchmarkState();
            const { url, terminate } = await this.initializeServer(
                benchmarkRemoteEntry || benchmarkEntry,
                projectConfig,
            );
            const browser = new HeadlessBrowser(url, projectConfig);

            try {
                await browser.initialize();
                runnerLogStream.onBenchmarkStart(benchmarkSignature);
                const { results } = await this.runIterations(
                    benchmarkSignature,
                    browser,
                    state,
                    runtimeOptions,
                    runnerLogStream,
                    interruption,
                );
                const version = await browser.version();
                const environment = await this.getEnvironment({ version }, projectConfig, globalConfig);
                snapshotResults.push({ results, environment, benchmarkInfo, projectConfig });
            } catch (e) {
                runnerLogStream.onBenchmarkError(benchmarkSignature);
                throw e;
            } finally {
                runnerLogStream.onBenchmarkEnd(benchmarkSignature);
                await browser.close();
                terminate();
            }
        }

        return snapshotResults;
    }

    initializeBenchmarkState(): BenchmarkResultsState {
        return { executedTime: 0, executedIterations: 0, results: [] };
    }

    async runIterations(
        benchmarkSignature: string,
        browser: HeadlessBrowser,
        state: BenchmarkResultsState,
        runtimeOptions: BenchmarkRuntimeConfig,
        runnnerLogStream: RunnerStream,
        interruption?: Interruption,
    ): Promise<BenchmarkResultsState> {
        return runtimeOptions.iterateOnClient
            ? this.runClientIterations(benchmarkSignature, browser, state, runtimeOptions, runnnerLogStream)
            : this.runServerIterations(
                  benchmarkSignature,
                  browser,
                  state,
                  runtimeOptions,
                  runnnerLogStream,
                  interruption,
              );
    }

    async runClientIterations(
        benchmarkSignature: string,
        browser: HeadlessBrowser,
        state: BenchmarkResultsState,
        runtimeOptions: BenchmarkRuntimeConfig,
        runnerLogStream: RunnerStream,
    ): Promise<BenchmarkResultsState> {
        // Run an iteration to estimate the time it will take
        const testResult = await this.runIteration(browser, { iterations: 1 });
        const estimatedIterationTime = testResult.aggregate;

        const start = Date.now();
        // eslint-disable-next-line lwc/no-set-interval
        const intervalId = setInterval(() => {
            const executing = Date.now() - start;
            state.executedTime = executing;
            state.executedIterations = Math.round(executing / estimatedIterationTime);
            const updatedState = { executedIterations: state.executedIterations, executedTime: state.executedTime };
            runnerLogStream.updateBenchmarkProgress(benchmarkSignature, updatedState, runtimeOptions);
        }, UPDATE_INTERVAL);

        await browser.reloadPage();
        const {
            results: [root],
        } = await this.runIteration(browser, runtimeOptions);
        state.results.push(root);
        clearInterval(intervalId);

        return state;
    }

    async runServerIterations(
        benchmarkSignature: string,
        browser: HeadlessBrowser,
        state: BenchmarkResultsState,
        runtimeOptions: BenchmarkRuntimeConfig,
        runnnerLogStream: RunnerStream,
        interruption?: Interruption,
    ): Promise<BenchmarkResultsState> {
        if (interruption && interruption.requestedInterruption) {
            throw new Error(`Halted execution: interruption`);
        }

        if (
            state.executedTime < runtimeOptions.maxDuration ||
            state.executedIterations < runtimeOptions.minSampleCount
        ) {
            const start = Date.now();
            const benchmarkResults = await this.runIteration(browser, runtimeOptions);
            const {
                results: [root],
            } = benchmarkResults;
            await browser.reloadPage();
            state.executedTime += Date.now() - start;
            state.executedIterations += 1;
            if (root) {
                state.results.push(root);
            }
            const updatedState = { executedIterations: state.executedIterations, executedTime: state.executedTime };
            runnnerLogStream.updateBenchmarkProgress(benchmarkSignature, updatedState, runtimeOptions);
            return this.runIterations(
                benchmarkSignature,
                browser,
                state,
                runtimeOptions,
                runnnerLogStream,
                interruption,
            );
        }

        return state;
    }

    runIteration(browser: HeadlessBrowser, payload: any): Promise<BenchmarkResults> {
        return browser.evaluate((o: any) => BEST.runBenchmark(o), payload);
    }

    static async getBrowserSpecs() {
        return HeadlessBrowser.getSpecs();
    }
}
