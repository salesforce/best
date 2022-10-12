/*
 * Copyright (c) 2019, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: MIT
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/MIT
 */

import { RUN_BENCHMARK } from '../constants';

export const makeDescribe = (name: string, parent?: RuntimeNodeDescribe, mode?: string): RuntimeNodeDescribe => ({
    type: 'group',
    mode: parent && !mode ? parent.mode : mode,
    children: [],
    hooks: [],
    startedAt: 0,
    aggregate: 0,
    name,
    parent,
});

export const makeBenchmark = (name: string, parent: RuntimeNodeDescribe, mode?: string): RuntimeNodeBenchmark => ({
    type: 'benchmark',
    mode: parent && !mode ? parent.mode : mode,
    hooks: [],
    name,
    parent,
    startedAt: 0,
    aggregate: 0,
});

export const makeBenchmarkRun = (fn: Function, parent: RuntimeNodeBenchmark): RuntimeNodeRunner => ({
    type: 'run',
    fn,
    name: RUN_BENCHMARK,
    parent,
    startedAt: 0,
    metrics: {},
    hooks: [],
    aggregate: 0,
});
