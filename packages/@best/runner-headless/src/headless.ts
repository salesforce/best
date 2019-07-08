import puppeteer, { CDPSession } from 'puppeteer';

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
    client?: CDPSession;

    constructor(url: string) {
        this.pageUrl = url;
    }

    async initialize() {
        this.browser = await puppeteer.launch(PUPPETEER_OPTIONS);
        this.page = await this.browser.newPage();
        this.client = await this.page.target().createCDPSession();
        await this.client.send('Performance.enable');
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

    async getNativePerformance() {
        if (this.page && this.client) {
            console.log("\n==== performance.getEntries() ====\n");
            console.log( await this.page.evaluate( () => JSON.stringify(performance.getEntries(), null, "  ") ) );

            console.log("\n==== performance.toJSON() ====\n");
            console.log( await this.page.evaluate( () => JSON.stringify(performance.toJSON(), null, "  ") ) );

            console.log("\n==== page.metrics() ====\n");
            const perf = await this.page.metrics();
            console.log( JSON.stringify(perf, null, "  ") );

            console.log("\n==== Devtools: Performance.getMetrics ====\n");
            let performanceMetrics: any = await this.client.send('Performance.getMetrics');
            console.log( performanceMetrics.metrics );
        }
    }

    close() {
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
            result = await this.page.evaluate(fn, payload);
            this.checkForErrors();
            console.log(JSON.stringify(result))
            await this.getNativePerformance();
        }

        return result;
    }
    version() {
        return this.browser ? this.browser.version(): Promise.resolve('unknown');
    }
}
