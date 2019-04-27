import AbstractRunner from '@best/runner-abstract';
import { remote as webdriverio, BrowserObject } from 'webdriverio';
import merge from 'deepmerge';

declare var BEST: any;

const WEBDRIVERIO_OPTIONS = {
    desiredCapabilities: {
        timeouts: { "implicit": 0, "pageLoad": 300000, "script": 120000 },
    },
    host: "localhost",
    port: "4444",
};

export default class Runner extends AbstractRunner {
    async loadUrl(url: string, projectConfig: any) {
        const options: any = merge(WEBDRIVERIO_OPTIONS, projectConfig.benchmarkRunnerConfig.webdriverOptions);
        const browser: BrowserObject = this.browser = webdriverio(options);
        this.page = browser.url(url);
        const { browserName, version } = options.desiredCapabilities;
        this.browserInfo = {
            version: `${browserName} ${version || ''}`.trim(),
            options
        };
    }

    runIteration(page: any, opts: any) {
        // eslint-disable-next-line prefer-arrow-callback
        return page.executeAsync(function (o: any, done: any) {
            // eslint-disable-next-line no-undef
            BEST.runBenchmark(o)
                // eslint-disable-next-line prefer-arrow-callback
                .then(function (data: any) {
                    done(data);
                })
                // eslint-disable-next-line prefer-arrow-callback
                .catch(function (e: Error) {
                    throw e;
                });
        }, opts)
            .then(({ value }: any) => value);
    }

    async reloadPage() {
        await this.page.refresh();
    }

    async closeBrowser() {
        if (this.browser) {
            await this.browser.end();
        }
    }
}
