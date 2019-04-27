export declare function buildBenchmark(entry: string, projectConfig: any, globalConfig: any, messager: any): Promise<{
    benchmarkName: string;
    benchmarkFolder: string;
    benchmarkSignature: string;
    benchmarkEntry: string;
    projectConfig: any;
    globalConfig: any;
}>;
export declare function buildBenchmarks(benchmarks: any, projectConfig: any, globalConfig: any, messager: any): Promise<{
    benchmarkName: string;
    benchmarkFolder: string;
    benchmarkSignature: string;
    benchmarkEntry: string;
    projectConfig: any;
    globalConfig: any;
}[]>;
