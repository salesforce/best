import { RunnerOutputStream } from "@best/console-stream";
import { FrozenGlobalConfig, FrozenProjectConfig, BenchmarkInfo, BenchmarkRuntimeConfig, BenchmarkResults, BenchmarkResultsState, BenchmarkResultsSnapshot } from '@best/types';
import AbstractRunner from '@best/runner-abstract';
import HeadlessBrowser from "./headless";

declare var BEST: any;
const UPDATE_INTERVAL = 300;

export default class Runner extends AbstractRunner {

    async run(benchmarkInfo: BenchmarkInfo, projectConfig: FrozenProjectConfig, globalConfig: FrozenGlobalConfig, runnerLogStream: RunnerOutputStream): Promise<BenchmarkResultsSnapshot> {
        const { benchmarkEntry } = benchmarkInfo;
        const { useHttp } = projectConfig;
        const runtimeOptions = this.getRuntimeOptions(projectConfig);
        const state = this.initializeBenchmarkState();
        const { url, terminate } = await this.initializeServer(benchmarkEntry, useHttp);
        const browser = new HeadlessBrowser(url);

        try {
            await browser.initialize();
            runnerLogStream.onBenchmarkStart(benchmarkEntry);
            const { results } = await this.runIterations(browser, state, runtimeOptions, runnerLogStream);
            const version = await browser.version();
            const environment = await this.getEnvironment({ version }, projectConfig, globalConfig);
            return { results, environment, benchmarkInfo };

        } catch (e) {
            runnerLogStream.onBenchmarkError(benchmarkEntry);
            throw e;
        } finally {
            runnerLogStream.onBenchmarkEnd(benchmarkEntry);
            browser.close();
            terminate();
        }
    }

    initializeBenchmarkState(): BenchmarkResultsState {
        return { executedTime: 0, executedIterations: 0, results: [] };
    }

    async runIterations(browser: HeadlessBrowser, state: BenchmarkResultsState, runtimeOptions: BenchmarkRuntimeConfig, runnnerLogStream: RunnerOutputStream): Promise<BenchmarkResultsState> {
        return runtimeOptions.iterateOnClient
            ? this.runClientIterations(browser, state, runtimeOptions, runnnerLogStream)
            : this.runServerIterations(browser, state, runtimeOptions, runnnerLogStream);
    }

    async runClientIterations(browser: HeadlessBrowser, state: BenchmarkResultsState, runtimeOptions: BenchmarkRuntimeConfig, runnerLogStream: RunnerOutputStream): Promise<BenchmarkResultsState> {
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

    async runServerIterations(browser: HeadlessBrowser, state: BenchmarkResultsState, runtimeOptions: BenchmarkRuntimeConfig, runnnerLogStream: RunnerOutputStream): Promise<BenchmarkResultsState> {
        if (state.executedTime < runtimeOptions.maxDuration || state.executedIterations < runtimeOptions.minSampleCount) {
            const start = Date.now();
            const benchmarkResults = await this.runIteration(browser, runtimeOptions);
            const { results: [root,] } = benchmarkResults;
            await browser.reloadPage();
            state.executedTime += Date.now() - start;
            state.executedIterations += 1;
            if (root) {
                state.results.push(root);
            }
            runnnerLogStream.updateBenchmarkProgress(state, runtimeOptions);
            return this.runIterations(browser, state, runtimeOptions, runnnerLogStream);
        }

        return state;
    }

    runIteration(browser: HeadlessBrowser, payload: any): Promise<BenchmarkResults> {
        return browser.evaluate((o: any) => BEST.runBenchmark(o), payload);
    }
}
