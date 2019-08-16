/*
 * Copyright (c) 2019, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: MIT
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/MIT
*/

import { buildBenchmark } from "./build-benchmark";

const send = process.send && process.send.bind(process);

if (!send) {
    throw new Error('This module must be used as a forked child');
}

const messagerAdapter = {
    onBenchmarkBuildStart(benchmarkPath: string) {
        send({
            type: 'messager.onBenchmarkBuildStart',
            benchmarkPath
        });
    },
    log(message: string) {
        send({
            type: 'messager.log',
            message,
        });
    },
    onBenchmarkBuildEnd(benchmarkPath: string) {
        send({
            type: 'messager.onBenchmarkBuildEnd',
            benchmarkPath
        });
    }
};

module.exports = async function (input: any, callback: Function) {
    const result = await buildBenchmark(
        input.benchmark,
        input.projectConfig,
        input.globalConfig,
        messagerAdapter
    );

    callback(null, result);
};
