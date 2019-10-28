/*
 * Copyright (c) 2019, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: MIT
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/MIT
*/

import { BenchmarkMetricNames } from './benchmark';

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
    uri: string;
}

export interface FrontendConfig {
    apiDatabase: ApiDatabaseConfig;
    githubConfig?: {
        repo: string;
        owner: string;
    }
}

export interface CliConfig {
    [key: string]: any,
    _: string[],
    help: boolean,
    clearCache: boolean,
    clearResults: boolean,
    gitIntegration?: string,
    useHttp: boolean,
    externalStorage?: string,
    runner: string,
    runnerConfig: { [x:string]: any },
    runInBand: boolean,
    config: string | undefined,
    projects: string[],
    iterations?: number,
    compareStats: string[] | undefined,
    generateHTML: boolean | undefined,
    dbAdapter: string | undefined,
    dbURI: string | undefined
}

export interface NormalizedConfig {
    nonFlagArgs: string[];
    cache: boolean,
    cacheDirectory: string,
    compareStats?: string[],
    gitIntegration: boolean,
    generateHTML: boolean,
    useHttp: boolean,
    externalStorage?: string,
    apiDatabase: ApiDatabaseConfig,
    commentThreshold: number,
    metrics: BenchmarkMetricNames[],
    isInteractive?: boolean,
    runInBatch?: boolean;
    openPages: boolean,
    moduleDirectories: string[],
    moduleFileExtensions: string[],
    moduleNameMapper: { [moduleName:string]: string },
    modulePathIgnorePatterns: string[],
    projectName: string,
    projects: string[],
    plugins: ProjectConfigPlugin[],
    runInBand: boolean,
    runner: string,
    runners: RunnerConfig[],
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
    samplesQuantileThreshold: number;
    rootDir: string
}

export interface GlobalConfig {
    gitIntegration: boolean;
    projects: string[];
    rootDir: string;
    runInBand: boolean;
    compareStats?: string[];
    nonFlagArgs: string[];
    isInteractive?: boolean;
    gitInfo: GitConfig;
    apiDatabase: ApiDatabaseConfig;
    commentThreshold: number;
    externalStorage?: string;
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
    metrics: BenchmarkMetricNames[];
    rootDir: string;
    testMatch: string[];
    runInBatch?: boolean;
    testPathIgnorePatterns: string[];
    samplesQuantileThreshold: number;
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
        system: {
            manufacturer: string,
            model: string,
        },
        cpu: {
            manufacturer: string;
            brand: string;
            family: string;
            model: string;
            speed: string;
            cores: number;
        },
        os: { platform: string, distro: string, release: string, kernel: string, arch: string };
    },
    container: {
        load: { cpuLoad: number }
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
