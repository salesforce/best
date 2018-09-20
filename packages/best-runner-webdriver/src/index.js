import { getSystemInfo } from '@best/utils';
import { remote as webdriverio } from 'webdriverio';
import merge from 'deepmerge';

const UPDATE_INTERVAL = 500;
const WEBDRIVERIO_OPTIONS = {
    desiredCapabilities: {
        timeouts: { "implicit": 0, "pageLoad": 300000, "script": 120000 },
    },
    host: "localhost",
    port: "4444",
};

export class Runner {
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

    async normalizeEnvironment(browser, projectConfig, globalConfig, webdriverOptions) {
        const {
            benchmarkOnClient,
            benchmarkRunner,
            benchmarkEnvironment,
            benchmarkIterations,
            projectName,
        } = projectConfig;
        const { system, cpu, os, load } = await getSystemInfo();
        const version = `${browser.desiredCapabilities.browserName} ${browser.desiredCapabilities.version}`;
        return {
            hardware: { system, cpu, os },
            runtime: { load },
            browser: { version, options: webdriverOptions },
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

    runIteration(page, state, opts) {
        // eslint-disable-next-line prefer-arrow-callback
        return page.executeAsync(function (o, done) {
            // eslint-disable-next-line no-undef
            BEST.runBenchmark(o)
                // eslint-disable-next-line prefer-arrow-callback
                .then(function (data) {
                    done(data);
                })
                // eslint-disable-next-line prefer-arrow-callback
                .catch(function (e) {
                    throw e;
                });
        }, opts);
    }

    async runIterations(page, state, opts, messager) {
        // Run an iteration to estimate the time it will take
        const result = await this.runIteration(page, state, { iterations: 1 });
        const testResult = result.value;
        const estimatedIterationTime = testResult.executedTime;

        const start = Date.now();
        // eslint-disable-next-line lwc/no-set-interval
        const intervalId = setInterval(() => {
            const executing = Date.now() - start;
            state.executedTime = executing;
            state.executedIterations = Math.round(executing / estimatedIterationTime);
            messager.updateBenchmarkProgress(state, opts);
        }, UPDATE_INTERVAL);

        await page.refresh();

        const clientRawResults = await this.runIteration(page, state, opts);
        clearInterval(intervalId);

        const results = clientRawResults.value.results;
        state.results.push(...results);

        return state;
    }

    async run({ benchmarkName, benchmarkEntry }, projectConfig, globalConfig, messager) {
        const opts = this.normalizeRuntimeOptions(projectConfig);
        const state = this.initializeBenchmarkState(opts);
        const { projectName, benchmarkRunnerConfig } = projectConfig;
        const webdriverOptions = merge(WEBDRIVERIO_OPTIONS, benchmarkRunnerConfig.webdriverOptions);

        let browser;
        try {
            browser = webdriverio(webdriverOptions);
            const environment = await this.normalizeEnvironment(browser, projectConfig, globalConfig, webdriverOptions);

            messager.onBenchmarkStart(benchmarkName, projectName);

            const url = 'file:///' + benchmarkEntry;
            const page = browser.init().url(url);

            const { results } = await this.runIterations(page, state, opts, messager);
            return { results, environment };
        } catch (e) {
            messager.onBenchmarkError(benchmarkName, projectName);
            throw e;
        } finally {
            messager.onBenchmarkEnd(benchmarkName, projectName);

            if (browser) {
                await browser.end();
            }
        }
    }
}
