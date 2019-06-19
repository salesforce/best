import { BenchmarkResultsSnapshot, BenchmarkResultNode, BenchmarkMetricNames, BenchmarkStats } from "@best/types";
import { VERSION } from './constants';
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

type BenchmarkMetricsAggregate = { [key in BenchmarkMetricNames]?: number[] }

// This type will hold as keys all benchmark names, and then an array with all results
interface BenchmarkMetricsMap {
    [key: string]: BenchmarkMetricsAggregate
}

// Given an iteration benchmark (whith nested benchmarks), collect its metrics
function collectResults({ name, metrics, nodes, aggregate }: BenchmarkResultNode, collector: BenchmarkMetricsMap) {
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

function createStructure({ nodes, name, type }: BenchmarkResultNode, collector: any): any {
    if (type === "benchmark") {
        const newNode = collector[name];
        newNode.name = name;
        return newNode;
    }

    if (nodes) {
        return {
            name,
            nodes: nodes.map((childNode: any) => createStructure(childNode, collector)),
        };
    }

    return collector[name];
}

export async function analyzeBenchmarks(benchmarkResults: BenchmarkResultsSnapshot[]) {
    return Promise.all(
        // For each benchmark file runned...
        benchmarkResults.map(async (benchmarkResult: BenchmarkResultsSnapshot) => {
            const { results, environment, benchmarkInfo: { benchmarkName }, projectConfig } = benchmarkResult;
            const structure = results[0];

            // Collect the metrics for the nested benchmarks within
            const collector: BenchmarkMetricsMap = results.reduce((reducer: BenchmarkMetricsMap, node: BenchmarkResultNode) => collectResults(node, reducer), {});

            // For each metric
            const benchmarkStats = Object.keys(collector).reduce((stats: any, benchmarkName: string) => {
                const benchmarkMetrics = collector[benchmarkName];

                stats[benchmarkName] = Object.keys(benchmarkMetrics).reduce((metricStats: any, metric: string) => {
                    const metricResults = benchmarkMetrics[metric as BenchmarkMetricNames];
                    if (Array.isArray(metricResults) && metricResults.length > 0) {
                        metricStats[metric] = computeSampleStats(metricResults, projectConfig.samplesQuantileThreshold);
                    }
                    return metricStats;
                }, {});

                return stats;
            }, {});

            const benchmarkStructure = createStructure(structure, benchmarkStats);

            console.log(benchmarkStructure);

            benchmarkResult.stats = {
                version: VERSION,
                benchmarkName,
                benchmarks: benchmarkStructure.benchmarks,
                environment,
            };
        }),
    );
}

export { compareSamples, computeSampleStats };
