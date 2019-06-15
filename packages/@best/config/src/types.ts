export interface RawBestConfig {
    [key: string]: any;
    rootDir: string;
    benchmarkIterations? : number;
    compareStats?: string[];

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
    runnerConfig: any,
    benchmarkEnvironment: string,
    benchmarkMaxDuration: number,
    benchmarkMinIterations: number,
    benchmarkOnClient: boolean,
    benchmarkIterations: number,
    benchmarkOutput: string,
    benchmarkEnvironmentOptions: {[key:string]: string },
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
    iterations: number,
    compareStats: string[] | undefined
}


export interface GlobalConfig {
    gitIntegration: boolean;
    projects: string[];
    detectLeaks: boolean;
}

export interface ProjectConfig {
    cacheDirectory: string;
}

export type FrozenGlobalConfig = Readonly<GlobalConfig>;
export type FrozenProjectConfig = Readonly<ProjectConfig>;


export interface ProjectConfigs {
    globalConfig: FrozenGlobalConfig,
    configs: FrozenProjectConfig[]
}
