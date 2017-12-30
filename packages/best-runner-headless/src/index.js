import puppeteer from "puppeteer";
import { getSystemInfo } from "./system-info";
import path from "path";

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

const PUPPETEER_OPTIONS = { args: BROWSER_ARGS };

async function runIterations(page, state, opts, messager) {
    if (state.executedTime < opts.maxDuration || state.executedIterations < opts.minSampleCount) {
        const start = Date.now();
        const results = await runIteration(page, state, opts);
        await page.reload();

        state.executedTime += (Date.now() - start);
        state.executedIterations += 1;
        state.results.push(results);

        messager.updateBenchmarkProgress(state, opts);

        if (state.iterateOnClient) {
            return state;
        }

        return runIterations(page, state, opts, messager);
    }

    return state;
}

async function runIteration(page, state, opts) {
    // eslint-disable-next-line no-undef
    const results = await page.evaluate(async (o) => BEST.runBenchmark(o), opts);

    return results;
}

function normalizeRuntimeOptions(proyectConfig) {
    const { benchmarkIterations, benchmarkOnClient } = proyectConfig;
    const definedIterations =  Number.isInteger(benchmarkIterations);

    // For benchmarking on the client or a defined number of iterations duration is irrelevant
    const maxDuration = (definedIterations || benchmarkOnClient) ? 1 : proyectConfig.benchmarkMaxDuration;
    const minSampleCount = definedIterations ? benchmarkIterations : proyectConfig.benchmarkMinIterations;

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
        iterateOnClient: opts.iterateOnClient
    };
}

async function normalizeEnvironment(browser) {
    const hardware = await getSystemInfo();
    const version = await browser.version();
    return {
        hardware,
        browser: { version, options: BROWSER_ARGS }
    };
}

export async function run(benchmarkEntry, proyectConfig, globalConfig, messager) {
    return puppeteer.launch(PUPPETEER_OPTIONS).then(async browser => {
        const opts =  normalizeRuntimeOptions(proyectConfig);
        const state =  initializeBenchmarkState(opts);
        const environment = await normalizeEnvironment(browser, proyectConfig, globalConfig);

        const page = await browser.newPage();
        await page.goto('file:///' + benchmarkEntry);

        const results = await runIterations(page, state, opts, messager);
        await browser.close();
        return { results, environment };
    });
}
