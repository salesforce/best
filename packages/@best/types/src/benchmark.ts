export interface BenchmarkInfo {
    benchmarkName: string,
    benchmarkEntry: string,
    benchmarkFolder: string,
    benchmarkSignature: string
}

export interface BenchmarkRuntimeConfig {
    maxDuration: number;
    minSampleCount: number,
    iterations: number,
    iterateOnClient: boolean
}

export interface BenchmarkMetrics {
    [key: string]: number;
    aggregate: number;
    script: number;
}

export enum BenchmarkNodeType { Benchmark, Group }
export type BenchmarkNodes = BenchmarkGroupNode[] | BenchmarkResultNode[];

export interface BenchmarkResultNode {
    type: BenchmarkNodeType.Benchmark;
    benchmark: string;
    startedAt: number;
    metrics: BenchmarkMetrics
}

export interface BenchmarkGroupNode {
    type: BenchmarkNodeType.Group;
    group: string;
    nodes: BenchmarkNodes;
    aggregate: number;
}

export interface BenchmarkResults {
    benchmarkName: string;
    executedIterations: number;
    aggregate: number;
    results: BenchmarkNodes;
}
