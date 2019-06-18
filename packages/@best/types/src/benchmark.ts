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

export interface BenchmarkMetrics {
    [key: string]: number;
    script: number;
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
