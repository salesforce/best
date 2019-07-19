import path from 'path';
import fs from 'fs';
import os from 'os';
import puppeteer from 'puppeteer';
import { parseTrace, removeTrace, mergeTracedMetrics } from './trace'
import { FrozenProjectConfig } from '@best/types';

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

function tempDir() {
    const TEMP_DIR_PREFIX = 'runner-headless-temp';
    return fs.mkdtempSync(path.join(os.tmpdir(), TEMP_DIR_PREFIX));
}

export default class HeadlessBrowser {
    pageUrl: string;
    projectConfig: FrozenProjectConfig;
    tracePath: string;
    browser?: puppeteer.Browser;
    page?: puppeteer.Page;
    pageError?: Error;

    constructor(url: string, projectConfig: FrozenProjectConfig) {
        this.pageUrl = url;
        this.projectConfig = projectConfig;
        this.tracePath = path.resolve(tempDir(), 'trace.json');
    }

    async initialize() {
        this.browser = await puppeteer.launch(PUPPETEER_OPTIONS);
        this.page = await this.browser.newPage();
        this.page.on('pageerror', (error: Error) => this.pageError = error);
        await this.page.goto(this.pageUrl);
        this.checkForErrors();
    }
    
    checkForErrors() {
        const pageError = this.pageError;
        if (pageError) {
            pageError.message = 'Benchmark parse error.\n' + pageError.message;
            throw pageError;
        }
    }

    async processTrace(result: any) {
        if (this.page) {
            const traces = await parseTrace(this.tracePath);
            mergeTracedMetrics(result, traces);
        }

        return result;
    }

    async close() {
        await removeTrace(this.tracePath);

        if (this.browser) {
            return this.browser.close();
        }
    }

    reloadPage() {
        if (this.page) {
            return this.page.reload();
        }
    }

    async evaluate(fn: any, payload: any) {
        let result;
        if (this.page) {
            await this.page.tracing.start({ path: this.tracePath })
            result = await this.page.evaluate(fn, payload);
            await this.page.tracing.stop()
            this.checkForErrors();
            result = await this.processTrace(result);
        }

        return result;
    }
    version() {
        return this.browser ? this.browser.version(): Promise.resolve('unknown');
    }
}
