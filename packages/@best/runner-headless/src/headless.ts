/*
 * Copyright (c) 2019, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: MIT
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/MIT
*/

import path from 'path';
import fs from 'fs';
import os from 'os';
import puppeteer from 'puppeteer';
import { parseTrace, removeTrace, mergeTracedMetrics } from './trace'
import { FrozenProjectConfig, BrowserSpec } from '@best/types';

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


const PUPPETEER_OPTIONS: puppeteer.BrowserLaunchArgumentOptions = { args: BROWSER_ARGS };

function tempDir() {
    const TEMP_DIR_PREFIX = 'runner-headless-temp';
    return fs.mkdtempSync(path.join(os.tmpdir(), TEMP_DIR_PREFIX));
}

interface HeadlessRunnerConfig {
    readonly launchOptions?: Readonly<puppeteer.LaunchOptions>;
}

export default class HeadlessBrowser {
    pageUrl: string;
    projectConfig: FrozenProjectConfig;
    tracePath: string;
    tracingEnabled: boolean;
    browser?: puppeteer.Browser;
    page?: puppeteer.Page;
    pageError?: Error;

    constructor(url: string, projectConfig: FrozenProjectConfig) {
        this.pageUrl = url;
        this.projectConfig = projectConfig;
        this.tracePath = path.resolve(tempDir(), 'trace.json');
        this.tracingEnabled = projectConfig.metrics.includes('paint') || projectConfig.metrics.includes('layout');
    }

    async initialize() {
        const runnerConfig: HeadlessRunnerConfig = this.projectConfig.benchmarkRunnerConfig || {};
        const { launchOptions = {} } = runnerConfig;
        this.browser = await puppeteer.launch({ ...PUPPETEER_OPTIONS, ...launchOptions });
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
        if (! this.page) return result;

        if (this.tracingEnabled) {
            const traces = await parseTrace(this.tracePath);
            mergeTracedMetrics(result, traces);
        }

        return result;
    }

    async close() {
        if (this.tracingEnabled) await removeTrace(this.tracePath);

        if (this.browser) {
            try {
                await this.browser.close();
            } catch(err) {
                console.log('[pupeteer] - close error', err);
            }
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
            if (this.tracingEnabled) await this.page.tracing.start({ path: this.tracePath });

            result = await this.page.evaluate(fn, payload);

            if (this.tracingEnabled) await this.page.tracing.stop();

            this.checkForErrors();
            result = await this.processTrace(result);
        }

        return result;
    }

    version() {
        return this.browser ? this.browser.version(): Promise.resolve('unknown');
    }

    static async getSpecs(): Promise<BrowserSpec[]> {
        // TODO: Create pupeteer test so we fail when upgrading
        return [
            { name: 'chrome.headless', version: '100' },
            { name: 'chrome', version: '100' }
        ];
    }
}
