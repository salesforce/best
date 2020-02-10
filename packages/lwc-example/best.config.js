/*
 * Copyright (c) 2019, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: MIT
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/MIT
*/

module.exports = {
    projectName: 'lwc-example',
    plugins: [
        ['@lwc/rollup-plugin', {
            rootDir: '<rootDir>/src/'
        }],
        ['rollup-plugin-replace', { 'process.env.NODE_ENV': JSON.stringify('production') }]
    ],
    specs: { name: 'chrome.headless', version: 80 },
    runners: [
        {
            runner: "@best/runner-headless",
            alias: "default"
        },
        {
            runner: "@best/runner-hub",
            alias: "heroku-hub",
            config: {
                host: "https://hub.bestjs.dev",
                options: {
                    query: { token: process.env.BEST_HUB_CLIENT_TOKEN },
                },
                spec: {
                    browser: "chrome",
                    version: "76"
                }
            }
        },
        {
            runner: "@best/runner-remote",
            alias: "local-remote",
            config: {
                uri: 'http://localhost:5001',
                options: { token: 'foo' }
            }
        }
    ]
};
