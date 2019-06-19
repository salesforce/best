import { BenchmarkMetricNames } from "./benchmark";

export type BenchmarkStatsNames = "samples" | "sampleSize" | "samplesQuantileThreshold" | "mean" | "median" | "variance" | "medianAbsoluteDeviation";
export interface BenchmarkStats {
    samples: number[],
    sampleSize: number,
    samplesQuantileThreshold: number,
    mean: number,
    median: number,
    variance: number,
    medianAbsoluteDeviation: number,
}

export type BenchmarkMetricsAggregate = { [key in BenchmarkMetricNames]?: number[] }
export type BenchmarkMetricStatsMap = { [key in BenchmarkMetricNames]?: BenchmarkStats; }

// This type will hold as keys all benchmark names, and then an array with all results
export interface AllBenchmarksMetricsMap { [key: string]: BenchmarkMetricsAggregate }
export interface AllBenchmarkMetricStatsMap { [key: string]: BenchmarkMetricStatsMap; }

export type MetricsStatsMap = {
    [key in BenchmarkMetricNames]?: {
        stats: {
            [key in BenchmarkStatsNames]?: BenchmarkStats
        }
    }
}

export interface StatsNode {
    type: "group" | "benchmark";
    name: string;
    nodes?: StatsNode[];
    metrics?: MetricsStatsMap
}
