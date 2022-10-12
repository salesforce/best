/*
 * Copyright (c) 2019, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: MIT
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/MIT
 */

import { BenchmarkMetricNames, BenchmarkResultNode, BenchmarkInfo } from './benchmark';
import { EnvironmentConfig, FrozenProjectConfig } from './config';

export interface BenchmarkResultsSnapshot {
    results: BenchmarkResultNode[];
    environment: EnvironmentConfig;
    benchmarkInfo: BenchmarkInfo;
    projectConfig: FrozenProjectConfig;
    stats?: StatsResults;
}

export type BenchmarkStatsNames =
    | 'samples'
    | 'sampleSize'
    | 'samplesQuantileThreshold'
    | 'mean'
    | 'median'
    | 'variance'
    | 'medianAbsoluteDeviation';
export interface BenchmarkStats {
    samples: number[];
    sampleSize: number;
    samplesQuantileThreshold: number;
    mean: number;
    median: number;
    variance: number;
    medianAbsoluteDeviation: number;
}

export type BenchmarkMetricsAggregate = {
    [key in BenchmarkMetricNames]?: number[];
};
export type BenchmarkMetricStatsMap = {
    [key in BenchmarkMetricNames]?: BenchmarkStats;
};

// This type will hold as keys all benchmark names, and then an array with all results
export interface AllBenchmarksMetricsMap {
    [key: string]: BenchmarkMetricsAggregate;
}
export interface AllBenchmarkMetricStatsMap {
    [key: string]: BenchmarkMetricStatsMap;
}

export type MetricsStatsMap = {
    [key in BenchmarkMetricNames]?: {
        stats: BenchmarkStats;
    };
};

type StatsNodeTypes = 'group' | 'benchmark';
export interface StatsNodeBase {
    type: StatsNodeTypes;
    name: string;
}

export interface StatsNodeBenchmark extends StatsNodeBase {
    type: 'benchmark';
    metrics: MetricsStatsMap;
}

export interface StatsNodeGroup extends StatsNodeBase {
    type: 'group';
    nodes: StatsNode[];
}

export type StatsNode = StatsNodeGroup | StatsNodeBenchmark;

export interface StatsResults {
    version: number;
    benchmarkName: string;
    results: StatsNode[];
}
