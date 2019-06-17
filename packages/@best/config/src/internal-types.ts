import { GitInfo } from "./utils/git";

export interface RawBestConfig {
    [key: string]: any;
    rootDir: string;
    benchmarkIterations? : number;
    compareStats?: string[];

}

export interface RunnerConfig {
    alias: string;
    runner: string;
    config: any;
}

export interface DefaultProjectOptions {
    [key: string]: any,
    cache: boolean,
    cacheDirectory: string,
    useHttp: boolean,
    openPages: boolean,
    moduleDirectories: string[],
    moduleFileExtensions: string[],
    moduleNameMapper: { [moduleName:string]: string },
    modulePathIgnorePatterns: string[],
    runner: string,
    runnerConfig: RunnerConfig,
    benchmarkEnvironment: string,
    benchmarkEnvironmentOptions: {[key:string]: string },
    benchmarkMaxDuration: number,
    benchmarkMinIterations: number,
    benchmarkOnClient: boolean,
    benchmarkIterations: number,
    benchmarkOutput: string,
    benchmarkCustomAssets: string,
    testMatch: string[],
    samplesQuantileThreshold: number,
    normalize: boolean,
    outputMetricNames: string,
    outputTotals: boolean,
    outputHistograms: boolean,
    outputHistogramNames: string,
    histogramQuantileRange: [number, number],
    histogramMaxWidth: number,
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
    detectLeaks: boolean;
    nonFlagArgs: string[];
    isInteractive? : boolean;
    gitInfo: GitInfo;
}

export type ProjectConfigPlugin = string | [string, { [key : string]: any }]

export interface ProjectConfig {
    benchmarkRunner: string;
    benchmarkOutput: string;
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
