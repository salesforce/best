/// <reference types="node" />
import AWS from 'aws-sdk';
export declare const AWS_TEXT: string;
export declare class S3 {
    s3: AWS.S3;
    bucket: string;
    host: string;
    version: string;
    constructor({ bucket, version }?: {
        bucket?: string;
        version?: string;
    });
    getBenchmarkUrlsForCommit(projectName: string, searchCommit: string): Promise<string[]>;
    getBenchmarkStatsUrl(projectName: string, searchCommit: string, benchmark: string): string;
    getProjects(): Promise<string[]>;
    listBranches(projectName: string): Promise<string[]>;
    getCommits(projectName: string, branchName: string): Promise<string[]>;
    listBenchmarks(projectName: string, commit: string): Promise<string[]>;
    getObjectsInFolder(...args: string[]): Promise<string[]>;
    storeBranchCommitIndex(projectName: string, branch: string, commit: string): Promise<unknown>;
    storeBenchmarkFile(relativePath: string, body: string | Buffer, { projectName, commit, benchmarkName }: {
        projectName: string;
        commit: string;
        benchmarkName: string;
    }): Promise<unknown>;
}
