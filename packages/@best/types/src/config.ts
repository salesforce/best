export interface GitConfig {
    lastCommit: { hash: string, date: string }
    localChanges: boolean,
    branch: string,
    repo: {
        owner: string,
        repo: string
    }
}

export interface UserConfig {
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

export interface CliConfig {
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

export interface GlobalConfig {
    gitIntegration: boolean;
    projects: string[];
    nonFlagArgs: string[];
    isInteractive?: boolean;
    gitInfo: GitConfig;
    apiDatabase?: ApiDatabaseConfig;
}

export type ProjectConfigPlugin = string | [string, { [key : string]: any }]

export interface ProjectConfig {
    useHttp: boolean;
    benchmarkRunner: string;
    benchmarkEnvironment: any;
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

export interface BuildConfig {
    benchmarkName: string,
    benchmarkFolder: string,
    benchmarkSignature: string,
    benchmarkEntry: string,
    projectConfig: FrozenProjectConfig,
    globalConfig: FrozenGlobalConfig,
}

export interface BrowserConfig {
    version: string;
    name?: string;
    config?: { [key: string]: any }
}


export interface EnvironmentConfig {
    hardware: {
    system: any;
        cpu: any;
        os: any;
    },
    container: {
        load: any
    },
    browser: BrowserConfig;
    configuration: {
        project: {
            projectName: string;
            benchmarkOnClient: boolean;
            benchmarkRunner: string;
            benchmarkEnvironment: any;
            benchmarkIterations: number;
        },
        global: {
            gitCommitHash: string;
            gitHasLocalChanges: boolean;
            gitBranch: string;
            gitRepository: { owner: string, repo: string };
        }
    }
}
