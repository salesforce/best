/*
 * Copyright (c) 2019, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: MIT
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/MIT
*/

import { initializeBenchmarkConfig, getBenckmarkState } from './state';
import { runBenchmark as _runBenchmark } from './runner';
export * from './primitives';

declare var window: any;

const setupBenchmark = (config: BenchmarkConfig) => initializeBenchmarkConfig(config);
const runBenchmark = async (config?: BenchmarkConfig) => {
    if (config) {
        setupBenchmark(config);
    }
    const benchmarkState = getBenckmarkState();
    const benchmarkResults = await _runBenchmark(benchmarkState);
    return benchmarkResults;
};

// Expose BEST API
const BEST = { setupBenchmark, runBenchmark };
window.BEST = BEST;
window.process = { env: { NODE_ENV: 'development' } };

// Auto-load
window.addEventListener('load', async () => {
    const config = setupBenchmark(window.BEST_CONFIG);
    if (config.autoStart) {
        window.BEST_RESULTS = await runBenchmark();
    }
});
