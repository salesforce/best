import AbstractRunner from '@best/runner-abstract';
import puppeteer from 'puppeteer';

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

export default class Runner extends AbstractRunner {
    async loadUrl(url) {
        const browser = this.browser = await puppeteer.launch(PUPPETEER_OPTIONS);
        const page = this.page = await browser.newPage();
        this.browserInfo = {
            version: await browser.version(),
            options: BROWSER_ARGS
        };
        let parseError;
        page.on('pageerror', err => (parseError = err));
        await page.goto(url);

        if (parseError) {
            parseError.message = 'Benchmark parse error.\n' + parseError.message;
            throw parseError;
        }
    }

    async runIteration(page, opts) {
        // eslint-disable-next-line no-undef
        return page.evaluate(o => BEST.runBenchmark(o), opts);
    }

    async runServerIterations(page, state, opts, messager) {
        if (state.executedTime < opts.maxDuration || state.executedIterations < opts.minSampleCount) {
            const start = Date.now();
            const results = await this.runIteration(page, opts);
            await page.reload();
            state.executedTime += Date.now() - start;
            state.executedIterations += 1;
            state.results.push(results.results[0]);
            messager.updateBenchmarkProgress(state, opts);
            return this.runIterations(page, state, opts, messager);
        }
        return state;
    }

    async reloadPage() {
        await this.page.reload();
    }

    async closeBrowser() {
        if (this.browser) {
            await this.browser.close();
        }
    }
}
