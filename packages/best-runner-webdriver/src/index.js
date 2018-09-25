import AbstractRunner from '@best/runner-abstract';
import { remote as webdriverio } from 'webdriverio';
import merge from 'deepmerge';

const WEBDRIVERIO_OPTIONS = {
    desiredCapabilities: {
        timeouts: { "implicit": 0, "pageLoad": 300000, "script": 120000 },
    },
    host: "localhost",
    port: "4444",
};

export default class Runner extends AbstractRunner {
    async loadUrl(url, projectConfig) {
        const options = merge(WEBDRIVERIO_OPTIONS, projectConfig.benchmarkRunnerConfig.webdriverOptions);
        const browser = this.browser = webdriverio(options);
        this.page = browser.init().url(url);
        const { browserName, version } = options.desiredCapabilities;
        this.browserInfo = {
            version: `${browserName} ${version || ''}`.trim(),
            options
        };
    }

    runIteration(page, opts) {
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
        }, opts)
            .then(({ value }) => value);
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
