interface GitOptions {
    rootDir?: string;
}
export declare function addGitInformation(options: GitOptions): Promise<(GitOptions & {
    gitCommit: string;
    gitLocalChanges: boolean;
    gitBranch: string;
    gitRepository: {
        owner: string;
        repo: string;
    };
}) | undefined>;
export {};
