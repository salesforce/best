import { getSystemInfo } from '@best/utils';
const webdriverio = require('webdriverio');

const UPDATE_INTERVAL = 500;
const BROWSER_OPTIONS = {
    desiredCapabilities: {
        platform: 'WINDOWS',
        browserName: 'internet explorer',
        version: '11',
        ignoreZoomSetting: true,
        initialBrowserUrl: 'about:blank',
        nativeEvents: false
    },
    host: 'localhost',
    port: 4444
}

function normalizeRuntimeOptions(projectConfig) {
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

function initializeBenchmarkState(opts) {
    return {
        executedTime: 0,
        executedIterations: 0,
        results: [],
        iterateOnClient: opts.iterateOnClient,
    };
}

async function normalizeEnvironment(browser, projectConfig, globalConfig) {
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
        browser: { version, options: BROWSER_OPTIONS },
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

function runIteration(page, state, opts) {
    // eslint-disable-next-line no-undef
    return page.executeAsync(function(o, done) {
        BEST.runBenchmark(o)
            .then(function(data) {
                done(data);
            })
            .catch(function(e) {
                done(e);
            });
    }, opts);
}

async function runIterations(page, state, opts, messager) {
    // Run an iteration to estimate the time it will take
    const result = await runIteration(page, state, { iterations: 1 });
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

    const clientRawResults = await runIteration(page, state, opts);
    clearInterval(intervalId);

    const results = clientRawResults.value.results;
    state.results.push(...results);

    return state;
}

export async function run({ benchmarkName, benchmarkEntry }, projectConfig, globalConfig, messager) {
    const opts = normalizeRuntimeOptions(projectConfig);
    const state = initializeBenchmarkState(opts);
    const { projectName } = projectConfig;
    const browserOptions = Object.assign({}, BROWSER_OPTIONS, projectConfig.benchmarkRunnerConfig);

    let browser;
    try {
        browser = webdriverio.remote(browserOptions);
        const environment = await normalizeEnvironment(browser, projectConfig, globalConfig);

        messager.onBenchmarkStart(benchmarkName, projectName);

        const url = 'file:///' + benchmarkEntry;
        const page = browser.init().url(url);

        const { results } = await runIterations(page, state, opts, messager);
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