import puppeteer from 'puppeteer';
import { parseTrace, removeTrace, mergeTracedMetrics } from './trace'

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

export default class HeadlessBrowser {
    pageUrl: string;
    browser?: puppeteer.Browser;
    page?: puppeteer.Page;
    pageError?: Error;

    constructor(url: string) {
        this.pageUrl = url;
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
            const traces = await parseTrace('trace.json');
            mergeTracedMetrics(result, traces);
        }

        return result;
    }

    async close() {
        await removeTrace('trace.json');

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
            // TODO: store this inside benchmark_results
            await this.page.tracing.start({ path: 'trace.json' })
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
