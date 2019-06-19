import { EnvironmentConfig, FrozenProjectConfig } from "./config";

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


export type BenchmarkMetricNames = "script" | "aggregate" | "paint" | "layout" | "system" | "idle";

export type BenchmarkMetrics = {
    [key in BenchmarkMetricNames]?: number;
}

export type ResultNodeTypes = "group" | "benchmark";
export interface BenchmarkResultNode {
    type: ResultNodeTypes;
    name: string;
    aggregate: number;
    startedAt: number;
    metrics?: BenchmarkMetrics;
    nodes? : BenchmarkResultNode[];
}

export interface BenchmarkResultGroupNode extends BenchmarkResultNode {
    type: "group";
    nodes : BenchmarkResultNode[];
}

export interface BenchmarkResultBenchmarkNode extends BenchmarkResultNode {
    type: "benchmark";
    metrics: BenchmarkMetrics;
}

export interface BenchmarkResults {
    benchmarkName: string;
    executedIterations: number;
    aggregate: number;
    results: BenchmarkResultNode[];
}


export interface BenchmarkResultsSnapshot {
    results: BenchmarkResultNode[];
    environment: EnvironmentConfig;
    benchmarkInfo: BenchmarkInfo;
    projectConfig: FrozenProjectConfig;
    stats?: any;
}

export interface BenchmarkResultsState {
    executedTime: number,
    executedIterations: number,
    results: BenchmarkResultNode[];
}
export interface BenchmarkStats {
    samples: number[],
    sampleSize: number,
    samplesQuantileThreshold: number,
    mean: number,
    median: number,
    variance: number,
    medianAbsoluteDeviation: number,
}
