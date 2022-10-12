/*
 * Copyright (c) 2019, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: MIT
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/MIT
 */

import { FrozenProjectConfig } from '@best/types';
import { remote } from 'webdriverio';
import merge from 'deepmerge';

const DEFAULT_WEBDRIVERIO_OPTIONS = {
    capabilities: {
        timeouts: { implicit: 0, pageLoad: 300000, script: 120000 },
        browserName: 'chrome',
    },
    hostname: 'localhost',
    port: 4444,
    logLevel: 'silent',
};

export default class WebdriverBrowser {
    pageUrl: string;
    projectConfig: FrozenProjectConfig;
    browser?: WebdriverIOAsync.BrowserObject;
    wdioOpts: any;

    constructor(url: string, projectConfig: FrozenProjectConfig) {
        this.pageUrl = url;
        this.projectConfig = projectConfig;
        this.wdioOpts = Object.assign({}, DEFAULT_WEBDRIVERIO_OPTIONS);

        // restricting what client config can override
        if (this.projectConfig.benchmarkRunnerConfig.webdriverOptions) {
            this.wdioOpts.capabilities = merge(
                this.wdioOpts.capabilities,
                this.projectConfig.benchmarkRunnerConfig.webdriverOptions.capabilities || {},
            );
        }
    }

    /**
     * Initialize a new browser session and navigate to pageUrl
     */
    async initialize() {
        this.browser = await remote(this.wdioOpts);
        await this.browser.url(this.pageUrl);
    }

    async close() {
        if (this.browser) {
            // TODO: (@jasonsilberman) these commands apperently dont exist anymore
            // return await this.browser.closeWindow();
        }
    }

    async reloadPage() {
        if (this.browser) {
            // TODO: (@jasonsilberman) these commands apperently dont exist anymore
            // await this.browser.refresh();
        }
    }

    async evaluate(fn: (o: any, done: any) => any, payload: any) {
        if (this.browser) {
            return await this.browser.executeAsync(fn, payload);
        }
        return null;
    }

    version() {
        return this.wdioOpts.capabilities ? this.wdioOpts.capabilities.browserVersion : 'unknown';
    }
}
