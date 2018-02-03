import puppeteer from 'puppeteer';
import { getSystemInfo } from './system-info';
import { clearInterval } from 'timers';

const BROWSER_ARGS = [
    '--no-sandbox',
    `--js-flags=--expose-gc`,
    '--disable-infobars',
    '--disable-background-networking',
    '--disable-extensions',
    '--disable-translate',
    '--no-first-run',
    '--ignore-certificate-errors',
    '--enable-precise-memory-info',
];

const UPDATE_INTERVAL = 300;
const PUPPETEER_OPTIONS = { args: BROWSER_ARGS };

async function runIteration(page, state, opts) {
    // eslint-disable-next-line no-undef
    return page.evaluate(o => BEST.runBenchmark(o), opts);
}

async function runClientIterations(page, state, opts, messager) {
    // Run an iteration to estimate the time it will take
    const testResult = await runIteration(page, state, { iterations: 1 });
    const estimatedIterationTime = testResult.executedTime;

    const start = Date.now();
    // eslint-disable-next-line lwc/no-set-interval
    const intervalId = setInterval(() => {
        const executing = Date.now() - start;
        state.executedTime = executing;
        state.executedIterations = Math.round(executing / estimatedIterationTime);
        messager.updateBenchmarkProgress(state, opts);
    }, UPDATE_INTERVAL);

    await page.reload();
    const clientRawResults = await runIteration(page, state, opts);
    clearInterval(intervalId);

    const results = clientRawResults.results;
    state.results.push(...results);

    return state;
}

async function runServerIterations(page, state, opts, messager) {
    if (state.executedTime < opts.maxDuration || state.executedIterations < opts.minSampleCount) {
        const start = Date.now();
        const results = await runIteration(page, state, opts);
        await page.reload();
        state.executedTime += Date.now() - start;
        state.executedIterations += 1;
        state.results.push(results.results[0]);
        messager.updateBenchmarkProgress(state, opts);
        return runIterations(page, state, opts, messager);
    }

    return state;
}

async function runIterations(page, state, opts, messager) {
    if (state.iterateOnClient) {
        return runClientIterations(page, state, opts, messager);
    }
    return runServerIterations(page, state, opts, messager);
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
    const version = await browser.version();
    return {
        hardware: { system, cpu, os },
        runtime: { load },
        browser: { version, options: BROWSER_ARGS },
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
                gitRepository: globalConfig.gitRepository
            },
        },
    };
}

export async function run({ benchmarkName, benchmarkEntry }, projectConfig, globalConfig, messager) {
    const opts = normalizeRuntimeOptions(projectConfig);
    const state = initializeBenchmarkState(opts);

    let browser;
    try {
        browser = await puppeteer.launch(PUPPETEER_OPTIONS);
        const environment = await normalizeEnvironment(browser, projectConfig, globalConfig);

        messager.onBenchmarkStart(benchmarkName);

        const page = await browser.newPage();
        await page.goto('file:///' + benchmarkEntry);

        const { results } = await runIterations(page, state, opts, messager);
        return { results, environment };
    } finally {
        messager.onBenchmarkEnd(benchmarkName);

        if (browser) {
            await browser.close();
        }
    }
}
