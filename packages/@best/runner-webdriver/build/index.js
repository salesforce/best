"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const runner_abstract_1 = __importDefault(require("@best/runner-abstract"));
const webdriverio_1 = require("webdriverio");
const deepmerge_1 = __importDefault(require("deepmerge"));
const WEBDRIVERIO_OPTIONS = {
    desiredCapabilities: {
        timeouts: { "implicit": 0, "pageLoad": 300000, "script": 120000 },
    },
    host: "localhost",
    port: "4444",
};
class Runner extends runner_abstract_1.default {
    async loadUrl(url, projectConfig) {
        const options = deepmerge_1.default(WEBDRIVERIO_OPTIONS, projectConfig.benchmarkRunnerConfig.webdriverOptions);
        const browser = this.browser = webdriverio_1.remote(options);
        this.page = browser.url(url);
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
exports.default = Runner;
//# sourceMappingURL=index.js.map