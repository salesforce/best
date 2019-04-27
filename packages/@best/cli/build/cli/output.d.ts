export default class Output {
    config: any;
    stream: any;
    constructor(config: any, stream: any);
    report(results: any): void;
    generateTotal(stats: any): void;
    writeStats(benchmarkName: string, resultsFolder: string, stats: any): void;
    writeEnvironment({ browser, runtime }: any): void;
    writeHistograms(benchmarks: any, parentPath?: string): void;
    generateRows(table: any, benchmarks: any, level?: number): void;
    compare(stats: any): void;
    generateComparisonTable(baseCommit: string, targetCommit: string, stats: any): any;
    generateComparisonRows(table: any, stats: any, name?: string): any;
}
