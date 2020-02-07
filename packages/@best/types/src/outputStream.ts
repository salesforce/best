/*
 * Copyright (c) 2019, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: MIT
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/MIT
*/

import { BenchmarkResultsState, BenchmarkRuntimeConfig } from "./benchmark";

export interface RunnerStream {
    init: () => void,
    finish: () => void,
    onBenchmarkStart: (benchmarkPath: string) => void,
    onBenchmarkEnd: (benchmarkPath: string) => void,
    onBenchmarkError: (benchmarkPath: string) => void,
    updateBenchmarkProgress: (benchmarkPath: string, state: BenchmarkResultsState, runtimeOpts: BenchmarkRuntimeConfig) => void,
    log: (message: string) => void;
}
