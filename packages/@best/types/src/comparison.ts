import { BenchmarkMetricNames } from './benchmark';
import { BenchmarkStats } from './stats';

export type ResultComparisonTypes = "project" | "group" | "benchmark";
export interface ResultComparisonBase {
    type: ResultComparisonTypes;
    name: string;
}

export interface ResultComparisonProject extends ResultComparisonBase {
    type: "project";
    comparisons: ResultComparison[]
}

export interface ResultComparisonGroup extends ResultComparisonBase {
    type: "group";
    comparisons: ResultComparison[]
}

export interface ResultComparisonBenchmark extends ResultComparisonBase {
    type: "benchmark";
    metrics: {
        [key in BenchmarkMetricNames]?: {
            baseStats: BenchmarkStats,
            targetStats: BenchmarkStats
            samplesComparison: 0 | 1 | -1
        }
    }
}

export type ResultComparison = ResultComparisonProject | ResultComparisonGroup | ResultComparisonBenchmark;

export interface BenchmarkComparison {
    baseCommit: string;
    targetCommit: string;
    comparisons: ResultComparison[]
}