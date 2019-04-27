export declare function initialize(): void;
export declare function storeBenchmarkResults(fileMap: any, { benchmarkName, benchmarkSignature, projectConfig }: {
    benchmarkName: string;
    benchmarkSignature: string;
    projectConfig: any;
}, globalConfig: any): Promise<void>;
export declare function getAllBenchmarkStatsPerCommit(projectName: string, commit: string): Promise<any[]>;
export declare function getProjects(): Promise<string[]>;
export declare function getCommits(projectName: string, branch: string): Promise<string[]>;
