/*
 * Copyright (c) 2019, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: MIT
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/MIT
*/

export default Object.freeze({
    benchmarkName: "",
    useMacroTaskAfterBenchmark: true,
    maxDuration: 1000 * 20, // 20 seconds
    minSampleCount: 30,
    iterations: 0,
    results: [],
    executedTime: 0,
    executedIterations: 0,
});
