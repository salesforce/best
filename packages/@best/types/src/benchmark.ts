/*
 * Copyright (c) 2019, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: MIT
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/MIT
 */

export interface BenchmarkInfo {
    benchmarkName: string;
    benchmarkEntry: string;
    benchmarkFolder: string;
    benchmarkSignature: string;
}

export interface BenchmarkRuntimeConfig {
    maxDuration: number;
    minSampleCount: number;
    iterations: number;
    iterateOnClient: boolean;
}

export enum BenchmarkMeasureType {
    Execute = 'BEST/execute',
    Before = 'BEST/before',
    After = 'BEST/after',
}

export type BenchmarkMetricNames = 'script' | 'aggregate' | 'paint' | 'layout' | 'system' | 'idle';

export type BenchmarkMetrics = {
    [key in BenchmarkMetricNames]?: number;
};

export type ResultNodeTypes = 'group' | 'benchmark';
export interface BenchmarkResultNodeBase {
    type: ResultNodeTypes;
    name: string;
    aggregate: number;
    startedAt: number;
}

export interface BenchmarkResultGroupNode extends BenchmarkResultNodeBase {
    type: 'group';
    nodes: BenchmarkResultNode[];
}

export interface BenchmarkResultBenchmarkNode extends BenchmarkResultNodeBase {
    type: 'benchmark';
    metrics: BenchmarkMetrics;
}

export type BenchmarkResultNode = BenchmarkResultGroupNode | BenchmarkResultBenchmarkNode;

export interface BenchmarkResults {
    benchmarkName: string;
    executedIterations: number;
    aggregate: number;
    results: BenchmarkResultNode[];
}

export interface BenchmarkResultsState {
    executedTime: number;
    executedIterations: number;
    results: BenchmarkResultNode[];
}

export interface BenchmarkUpdateState {
    executedTime: number;
    executedIterations: number;
}
