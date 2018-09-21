import { getSystemInfo } from '@best/utils';

const UPDATE_INTERVAL = 300;

export default class Runner {
    async run({ benchmarkName, benchmarkEntry }, projectConfig, globalConfig, messager) {
        const opts = this.normalizeRuntimeOptions(projectConfig);
        const state = this.initializeBenchmarkState(opts);
        const { projectName } = projectConfig;

        try {
            const url = 'file:///' + benchmarkEntry;
            await this.loadUrl(url, projectConfig);
            const environment = await this.normalizeEnvironment(this.browserInfo, projectConfig, globalConfig);
            messager.onBenchmarkStart(benchmarkName, projectName);
            const { results } = await this.runIterations(this.page, state, opts, messager);
            return { results, environment };
        } catch (e) {
            messager.onBenchmarkError(benchmarkName, projectName);
            throw e;
        } finally {
            messager.onBenchmarkEnd(benchmarkName, projectName);
            this.closeBrowser();
        }
    }

    normalizeRuntimeOptions(projectConfig) {
        const { benchmarkIterations, benchmarkOnClient } = projectConfig;
        const definedIterations = Number.isInteger(benchmarkIterations);
        // For benchmarking on the client or a defined number of iterations duration is irrelevant
        const maxDuration = definedIterations ? 1 : projectConfig.benchmarkMaxDuration;
        const minSampleCount = definedIterations ? benchmarkIterations : projectConfig.benchmarkMinIterations;

        return {
            maxDuration,
            minSampleCount,
            iterations: benchmarkIterations,
            iterateOnClient: benchmarkOnClient,
        };
    }

    initializeBenchmarkState(opts) {
        return {
            executedTime: 0,
            executedIterations: 0,
            results: [],
            iterateOnClient: opts.iterateOnClient,
        };
    }

    async normalizeEnvironment(browser, projectConfig, globalConfig) {
        const {
            benchmarkOnClient,
            benchmarkRunner,
            benchmarkEnvironment,
            benchmarkIterations,
            projectName,
        } = projectConfig;
        const { system, cpu, os, load } = await getSystemInfo();
        return {
            hardware: { system, cpu, os },
            runtime: { load },
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
                    gitCommitHash: globalConfig.gitCommit,
                    gitHasLocalChanges: globalConfig.gitLocalChanges,
                    gitBranch: globalConfig.gitBranch,
                    gitRepository: globalConfig.gitRepository,
                },
            },
        };
    }

    async runIterations(page, state, opts, messager) {
        return state.iterateOnClient || !this.runServerIterations
            ? this.runClientIterations(page, state, opts, messager)
            : this.runServerIterations(page, state, opts, messager);
    }

    async runClientIterations(page, state, opts, messager) {
        // Run an iteration to estimate the time it will take
        const testResult = await this.runIteration(page, { iterations: 1 });
        const estimatedIterationTime = testResult.executedTime;

        const start = Date.now();
        // eslint-disable-next-line lwc/no-set-interval
        const intervalId = setInterval(() => {
            const executing = Date.now() - start;
            state.executedTime = executing;
            state.executedIterations = Math.round(executing / estimatedIterationTime);
            messager.updateBenchmarkProgress(state, opts);
        }, UPDATE_INTERVAL);

        await this.reloadPage(page);
        const clientRawResults = await this.runIteration(page, opts);
        clearInterval(intervalId);

        const results = clientRawResults.results;
        state.results.push(...results);
        return state;
    }
}
