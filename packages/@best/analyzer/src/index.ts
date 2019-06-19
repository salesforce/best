import { VERSION } from './constants';
import { BenchmarkResultsSnapshot, BenchmarkResultNode, BenchmarkMetricNames, BenchmarkStats, AllBenchmarksMetricsMap, BenchmarkMetricsAggregate, AllBenchmarkMetricStatsMap, StatsNode, BenchmarkMetricStatsMap } from "@best/types";
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
function collectResults({ name, metrics, nodes, aggregate }: BenchmarkResultNode, collector: AllBenchmarksMetricsMap) {
    let collectorNode = collector[name];
    if (!collectorNode) {
        collectorNode = collector[name] = { script: [], aggregate: [] };
    }

    if (aggregate > 0 && collectorNode.aggregate) {
        collectorNode.aggregate.push(aggregate);
    }

    if (metrics) {
        Object.keys(metrics).reduce((collector: BenchmarkMetricsAggregate, key: string) => {
            const bucket = collector[key as BenchmarkMetricNames];
            const value = metrics[key as BenchmarkMetricNames];
            if (bucket && value) {
                bucket.push(value);
            }

            return collector;
        }, collectorNode);
    }

    if (nodes) {
        nodes.forEach((node: BenchmarkResultNode) => collectResults(node, collector));
    }

    return collector;
}

function createStatsStructure({ nodes: children = [], name, type }: BenchmarkResultNode, collector: AllBenchmarkMetricStatsMap): StatsNode {
    if (type === "benchmark") {
        const stats = collector[name];
        const metrics = Object.keys(stats).reduce((metricReducer: any, metric: string) => {
            metricReducer[metric as BenchmarkMetricNames] = { stats: stats[metric as BenchmarkMetricNames] };
            return metricReducer;
        }, {});
        return { type, name, metrics };
    } else {
        const nodes = children.map((childNode: BenchmarkResultNode) => createStatsStructure(childNode, collector))
        return { type, name, nodes };
    }
}

export async function analyzeBenchmarks(benchmarkResults: BenchmarkResultsSnapshot[]) {
    return Promise.all(
        // For each benchmark file runned...
        benchmarkResults.map(async (benchmarkResult: BenchmarkResultsSnapshot) => {
            const { results, environment, benchmarkInfo: { benchmarkName }, projectConfig } = benchmarkResult;
            const structure = results[0];

            // Collect the metrics for the nested benchmarks within
            const collector: AllBenchmarksMetricsMap = results.reduce((reducer: AllBenchmarksMetricsMap, node: BenchmarkResultNode) => collectResults(node, reducer), {});

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

            const benchmarkStructure = createStatsStructure(structure, benchmarkStats);

            console.log(JSON.stringify(benchmarkStructure, null, '  '));

            benchmarkResult.stats = {
                version: VERSION,
                benchmarkName,
                benchmarks: benchmarkStructure.nodes,
                environment,
            };
        }),
    );
}

export { compareSamples, computeSampleStats };
