import { GitInfo } from "./utils/git";

export interface UserBestConfig {
    [key: string]: any;
    rootDir: string;
    projectName: string;
    nonFlagArgs: string[];
}

export interface RunnerConfig {
    alias: string;
    runner: string;
    config?: any;
}

export interface ApiDatabaseConfig {
    adapter: string;
    path: string;
}

export interface NormalizedConfig {
    nonFlagArgs: string[];
    cache: boolean,
    cacheDirectory: string,
    compareStats?: string[],
    gitIntegration: boolean,
    useHttp: boolean,
    externalStorage?: string,
    apiDatabase?: ApiDatabaseConfig,
    isInteractive?: boolean,
    openPages: boolean,
    moduleDirectories: string[],
    moduleFileExtensions: string[],
    moduleNameMapper: { [moduleName:string]: string },
    modulePathIgnorePatterns: string[],
    projectName: string,
    projects: string[],
    plugins: ProjectConfigPlugin[],
    runner: string,
    runners?: RunnerConfig[],
    runnerConfig: any,
    benchmarkEnvironment: string,
    benchmarkEnvironmentOptions: {[key:string]: string },
    benchmarkMaxDuration: number,
    benchmarkMinIterations: number,
    benchmarkOnClient: boolean,
    benchmarkIterations: number,
    benchmarkOutput: string,
    benchmarkCustomAssets: string,
    testMatch: string[],
    testPathIgnorePatterns: string[],
    rootDir: string
}

export interface BestCliOptions {
    [key: string]: any,
    _: string[],
    help: boolean,
    clearCache: boolean,
    clearResults: boolean,
    gitIntegration: string | undefined,
    useHttp: boolean,
    externalStorage: string | undefined,
    runner: string,
    runnerConfig: { [x:string]: any },
    config: string | undefined,
    projects: string[],
    iterations?: number,
    compareStats: string[] | undefined
}

export interface GlobalConfig {
    gitIntegration: boolean;
    projects: string[];
    nonFlagArgs: string[];
    isInteractive?: boolean;
    gitInfo: GitInfo;
    apiDatabase?: ApiDatabaseConfig;
}

export type ProjectConfigPlugin = string | [string, { [key : string]: any }]

export interface ProjectConfig {
    useHttp: boolean;
    benchmarkRunner: string;
    benchmarkRunnerConfig: any;
    benchmarkOutput: string;
    benchmarkOnClient: boolean;
    benchmarkMaxDuration: number;
    benchmarkMinIterations: number;
    benchmarkIterations: number;
    benchmarkCustomAssets: string;
    cacheDirectory: string;
    projectName: string;
    plugins: ProjectConfigPlugin[];
    rootDir: string;
    testMatch: string[];
    testPathIgnorePatterns: string[];
}

export type FrozenGlobalConfig = Readonly<GlobalConfig>;
export type FrozenProjectConfig = Readonly<ProjectConfig>;

export interface ProjectConfigs {
    globalConfig: FrozenGlobalConfig,
    configs: FrozenProjectConfig[]
}
