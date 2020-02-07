/*
 * Copyright (c) 2019, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: MIT
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/MIT
*/

module.exports = {
    projectName: 'best-benchmark',
    metrics: ['script', 'aggregate'],
    specs: { name: 'chrome.headless', version: '70' },
    runners: [
        {
            runner: "@best/runner-headless",
            alias: "default",
            specs: { name: 'chrome.headless', version: '71' }
        },
        {
            runner: "@best/runner-remote",
            alias: "local-remote",
            config: {
                uri: 'http://localhost:5000',
                options: { token: 'foo' }
            }
        }
    ]
};
