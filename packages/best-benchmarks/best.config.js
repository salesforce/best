/*
 * Copyright (c) 2019, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: MIT
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/MIT
*/

module.exports = {
    orgName: "lightning",
    projectName: 'builder-framework-benchmarks-repo',
    specs: { name: 'chrome.headless', version: '80' },
    benchmarkIterations: 60,
    runners: [
      {
        alias: 'default',
        runner: '@best/runner-headless',
      },
    ],
    apiDatabase: {
      adapter: 'sql/postgres',
      uri: 'postgresql://postgres:123456@localhost:5432/postgres',
      ssl: false,
    },
    githubConfig: {
      owner: 'sutturu',
      repo: 'builder-framework',
    },
  };  
