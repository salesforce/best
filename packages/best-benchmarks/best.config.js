/*
 * Copyright (c) 2019, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: MIT
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/MIT
*/

module.exports = {
    projectName: 'best-benchmark',
    metrics: ['script', 'aggregate', 'paint', 'layout'],
    specs: { name: 'chrome.headless', version: 100 },
    runners: [
        {
            runner: "@best/runner-headless",
            alias: "default",
        },
        {
            runner: "@best/runner-remote",
            alias: "local-remote",
            config: {
                uri: 'http://localhost:5001',
                options: { authToken: 'agent' }
            }
        },
        {
            runner: "@best/runner-remote",
            alias: "local-hub",
            config: {
                uri: 'http://localhost:5000',
                options: { authToken: 'hub' }
            }
        }
    ]
};
