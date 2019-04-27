export declare function runBenchmarks(benchmarksBuilds: any, globalConfig: any, messager: any): Promise<any[]>;
export declare function runBenchmark({ benchmarkName, benchmarkEntry, benchmarkSignature, projectConfig, globalConfig }: {
    benchmarkName: string;
    benchmarkEntry: string;
    benchmarkSignature: string;
    projectConfig: any;
    globalConfig: any;
}, messager: any): Promise<any>;
