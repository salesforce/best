export declare function initialize({ rootDir }: {
    rootDir: string;
}): void;
export declare function storeBenchmarkResults(): Promise<void>;
export declare function getAllBenchmarkStatsPerCommit(projectName: string, commit: string): Promise<any[]>;
export declare function getProjects(): void;
export declare function getCommits(): void;
