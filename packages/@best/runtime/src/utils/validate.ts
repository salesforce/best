/*
 * Copyright (c) 2019, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: MIT
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/MIT
*/

export function validateState(benchmarkState: BenchmarkState) {
    const {
        rootDescribeBlock,
        currentDescribeBlock,
        benchmarkDefinitionError
    } = benchmarkState;

    if (benchmarkDefinitionError) {
        return; // Nothing to do; there is already an error
    }

    if (rootDescribeBlock !== currentDescribeBlock) {
        benchmarkState.benchmarkDefinitionError = new Error('Benchmark parsing error');
    }

    if (rootDescribeBlock.children.length === 0) {
        benchmarkState.benchmarkDefinitionError = new Error('No benchmarks to run');
    }
}
