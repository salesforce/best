import { compare as compareSamples } from './stats';
declare function computeSampleStats(arr: number[], config: any): {
    samples: number[];
    sampleSize: number;
    samplesQuantileThreshold: any;
    mean: number;
    median: number | null;
    variance: number;
    medianAbsoluteDeviation: number | null | undefined;
};
export declare function analyzeBenchmarks(benchmarkResults: any): Promise<[unknown, unknown, unknown, unknown, unknown, unknown, unknown, unknown, unknown, unknown]>;
export { compareSamples, computeSampleStats };
