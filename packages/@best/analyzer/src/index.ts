/*
 * Copyright (c) 2019, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: MIT
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/MIT
*/

import { VERSION } from './constants';
import { BenchmarkResultsSnapshot, BenchmarkResultNode, BenchmarkMetricNames, BenchmarkStats, AllBenchmarksMetricsMap, BenchmarkMetricsAggregate, AllBenchmarkMetricStatsMap, StatsNode, BenchmarkMetricStatsMap, StatsNodeGroup, MetricsStatsMap, FrozenProjectConfig } from "@best/types";
import { quantile, mean, median, variance, medianAbsoluteDeviation, compare as compareSamples } from './stats';

function computeSampleStats(arr: number[], samplesQuantileThreshold: number): BenchmarkStats {
    if (samplesQuantileThreshold < 1) {
        const q = quantile(arr, samplesQuantileThreshold);
        arr = arr.filter(v => v <= q);
    }

    return {
        samples: arr,
        sampleSize: arr.length,
        samplesQuantileThreshold,
        mean: mean(arr),
        median: median(arr),
        variance: variance(arr),
        medianAbsoluteDeviation: medianAbsoluteDeviation(arr),
    };
}

// Given an iteration benchmark (whith nested benchmarks), collect its metrics
function collectResults(resultNode: BenchmarkResultNode, collector: AllBenchmarksMetricsMap, projectConfig: FrozenProjectConfig) {
    const { name } = resultNode;
    let collectorNode = collector[name];
    if (!collectorNode) {
        const emptyMetrics = projectConfig.metrics.reduce((acc, key) => ({
            ...acc,
            [key as BenchmarkMetricNames]: []
        }), {})
        collectorNode = collector[name] = emptyMetrics;
    }

    if (resultNode.aggregate > 0 && collectorNode.aggregate) {
        collectorNode.aggregate.push(resultNode.aggregate);
    }

    if (resultNode.type === "benchmark") {
        const { metrics } = resultNode;
        Object.keys(metrics).reduce((collector: BenchmarkMetricsAggregate, key: string) => {
            const bucket = collector[key as BenchmarkMetricNames];
            const value = metrics[key as BenchmarkMetricNames];
            if (bucket && value) {
                bucket.push(value);
            }

            return collector;
        }, collectorNode);
    } else {
        resultNode.nodes.forEach((node: BenchmarkResultNode) => collectResults(node, collector, projectConfig));
    }

    return collector;
}

function createStatsStructure(node: BenchmarkResultNode, collector: AllBenchmarkMetricStatsMap): StatsNode {
    if (node.type === "benchmark") {
        const { name, type } = node;
        const metricStats = collector[name];
        const metrics = Object.keys(metricStats).reduce((metricReducer: MetricsStatsMap, metric: string) => {
            const stats = metricStats[metric as BenchmarkMetricNames];
            if (stats) {
                metricReducer[metric as BenchmarkMetricNames] = { stats };
            }
            return metricReducer;
        }, {});
        return { type, name, metrics };
    } else {
        const { name, type, nodes: children } = node;
        const nodes = children.map((childNode: BenchmarkResultNode) => createStatsStructure(childNode, collector))
        return { type, name, nodes };
    }
}

export async function analyzeBenchmarks(benchmarkResults: BenchmarkResultsSnapshot[]) {
    return Promise.all(
        // For each benchmark file runned...
        benchmarkResults.map(async (benchmarkResult: BenchmarkResultsSnapshot) => {
            const { results, benchmarkInfo: { benchmarkName }, projectConfig } = benchmarkResult;
            const structure = results[0];

            // Collect the metrics for the nested benchmarks within
            const collector: AllBenchmarksMetricsMap = results.reduce((reducer: AllBenchmarksMetricsMap, node: BenchmarkResultNode) => collectResults(node, reducer, projectConfig), {});

            // For each metric
            const benchmarkStats: AllBenchmarkMetricStatsMap = Object.keys(collector).reduce((stats: AllBenchmarkMetricStatsMap, benchmarkName: string) => {
                const benchmarkMetrics = collector[benchmarkName];

                stats[benchmarkName] = Object.keys(benchmarkMetrics).reduce((metricStats: BenchmarkMetricStatsMap, metric: string) => {
                    const metricResults = benchmarkMetrics[metric as BenchmarkMetricNames];
                    if (Array.isArray(metricResults) && metricResults.length > 0) {
                        metricStats[metric as BenchmarkMetricNames] = computeSampleStats(metricResults, projectConfig.samplesQuantileThreshold);
                    }
                    return metricStats;
                }, {});

                return stats;
            }, {});

            const benchmarkStructure = createStatsStructure(structure, benchmarkStats) as StatsNodeGroup;

            benchmarkResult.stats = {
                version: VERSION,
                benchmarkName,
                results: benchmarkStructure.nodes
            };
        }),
    );
}

export { compareSamples, computeSampleStats };
