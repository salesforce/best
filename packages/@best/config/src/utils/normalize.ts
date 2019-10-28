/*
 * Copyright (c) 2019, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: MIT
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/MIT
*/

import path from 'path';
import chalk from 'chalk';
import DEFAULT_CONFIG from './defaults';
import { replacePathSepForRegex } from '@best/regex-util';
import { CliConfig, UserConfig, NormalizedConfig, RunnerConfig } from '@best/types';

const TARGET_COMMIT = process.env.TARGET_COMMIT;
const BASE_COMMIT = process.env.BASE_COMMIT;

function normalizeModulePathPatterns(options: any, key: string) {
    return options[key].map((pattern: any) => replacePathSepForRegex(normalizeRootDirPattern(pattern, options.rootDir)));
}

function normalizeRunner(runner: string, runners: RunnerConfig[]) {
    const defaultRunners = runners.filter((c: RunnerConfig) => c.alias === undefined || c.alias === 'default');
    if (defaultRunners.length > 1) {
        throw new Error('Wrong configuration: More than one default configuration declared');
    }

    if (runner === "default") {
        if (!defaultRunners.length) {
            throw new Error('No default runner found');
        }
        return defaultRunners[0].runner;
    }

    const selectedRunner = runners.find((c: RunnerConfig) => c.alias === runner || c.runner === runner);

    if (!selectedRunner) {
        throw new Error(`Unable to find a runner for ${runner}`);
    }

    return selectedRunner.runner;
}

function normalizeRunnerConfig(runner: string, runners?: RunnerConfig[]) {
    if (!runners) {
        return {};
    }

    if (runner === "default") {
        const defaultRunners = runners.filter((c: RunnerConfig) => c.alias === undefined || c.alias === 'default');
        if (defaultRunners.length > 0) {
            return defaultRunners[0].config ? defaultRunners[0].config : {};
        }
    }

    const selectedRunner = runners.find((c: RunnerConfig) => c.alias === runner || c.runner === runner);

    if (!selectedRunner) {
        throw new Error(`Unable to find a runner for ${runner}`);
    }

    return selectedRunner ? selectedRunner.config : {};
}

function setCliOptionOverrides(initialOptions: UserConfig, argsCLI: CliConfig): UserConfig {
    const argvToOptions = Object.keys(argsCLI)
        .reduce((options: any, key: string) => {
            switch (key) {
                case '_':
                    options.nonFlagArgs = argsCLI[key] || [];
                    break;
                case 'disableInteractive':
                    options.isInteractive = argsCLI[key] !== undefined ? false : undefined;
                    break;
                case 'iterations':
                    options.benchmarkIterations = argsCLI[key];
                    break;
                case 'runInBatch':
                    options.runInBatch = !!argsCLI[key];
                    break;
                case 'runInBand':
                    options.runInBand = !!argsCLI[key];
                    break;
                case 'projects':
                    if (argsCLI.projects && argsCLI.projects.length) {
                        options.projects = argsCLI.projects;
                    }
                    break;
                case 'compareStats':
                    options.compareStats = argsCLI.compareStats && argsCLI.compareStats.filter(Boolean);
                    break;
                case 'gitIntegration':
                    options.gitIntegration = Boolean(argsCLI[key]);
                    break;
                case 'generateHTML':
                    options.generateHTML = Boolean(argsCLI[key]);
                    break;
                case 'dbAdapter':
                    if (argsCLI[key] !== undefined) {
                        options.apiDatabase ={ adapter: argsCLI[key], uri: argsCLI['dbURI'] }
                    }
                    break;
                case 'dbURI':
                    break
                default:
                    options[key] = argsCLI[key];
                    break;
            }
            return options;
        }, {});

    return { ...initialOptions, ...argvToOptions };
}
function normalizeObjectPathPatterns(options: { [key: string]: any }, rootDir: string) {
    return Object.keys(options).reduce((m: any, key) => {
        const value = options[key];
        if (typeof value === 'string') {
            m[key] = normalizeRootDirPattern(value, rootDir);
        } else {
            m[key] = value;
        }
        return m;
    }, {});
}

function normalizePlugins(plugins: any, { rootDir }: UserConfig) {
    return plugins.map((plugin: any) => {
        if (typeof plugin === 'string') {
            return normalizeRootDirPattern(plugin, rootDir);
        } else if (Array.isArray(plugin)) {
            return [normalizeRootDirPattern(plugin[0], rootDir), normalizeObjectPathPatterns(plugin[1], rootDir)];
        }
        return plugin;
    });
}

function normalizeRootDir(options: UserConfig): UserConfig {
    // Assert that there *is* a rootDir
    if (!options.hasOwnProperty('rootDir')) {
        throw new Error(`  Configuration option ${chalk.bold('rootDir')} must be specified.`);
    }

    options.rootDir = path.normalize(options.rootDir);
    return options;
}

function normalizeCommits(commits?: string[]): string[] | undefined {
    if (!commits) {
        return undefined;
    }

    let [base, target] = commits;
    base = (base || BASE_COMMIT || '');
    target = (target || TARGET_COMMIT || '');
    return [base.slice(0, 7), target.slice(0, 7)];
}

export function normalizeRootDirPattern(str: string, rootDir: string) {
    return str.replace(/<rootDir>/g, rootDir);
}

export function normalizeRegexPattern(names: string | string[] | RegExp) {
    if (typeof names === 'string') {
        names = names.split(',');
    }
    if (Array.isArray(names)) {
        names = names.map(name => name.replace(/\*/g, '.*'));
        names = new RegExp(`^(${names.join('|')})$`);
    }
    if (!(names instanceof RegExp)) {
        throw new Error(`  Names must be provided as a string, array or regular expression.`);
    }
    return typeof names === 'string' ? new RegExp(names) : names;
}

export function normalizeConfig(userConfig: UserConfig, cliOptions: CliConfig): NormalizedConfig {
    const userCliMergedConfig = normalizeRootDir(setCliOptionOverrides(userConfig, cliOptions));
    const normalizedConfig: NormalizedConfig = { ...DEFAULT_CONFIG, ...userCliMergedConfig };

    Object.keys(normalizedConfig).reduce((mergeConfig: NormalizedConfig, key: string) => {
        switch (key) {
            case 'projects':
                mergeConfig[key] = normalizeModulePathPatterns(normalizedConfig, key);
                break;
            case 'plugins':
                mergeConfig[key] = normalizePlugins(normalizedConfig[key], normalizedConfig);
                break;
            case 'runner':
                mergeConfig[key] = normalizeRunner(normalizedConfig[key], mergeConfig.runners);
                break;
            case 'runnerConfig':
                mergeConfig[key] = normalizeRunnerConfig(normalizedConfig['runner'], mergeConfig.runners);
                break;
            case 'compareStats':
                mergeConfig[key] = normalizeCommits(normalizedConfig[key]);
                break;
            case 'apiDatabase': {
                const apiDatabaseConfig = normalizedConfig[key];
                mergeConfig[key] = apiDatabaseConfig ? normalizeObjectPathPatterns(apiDatabaseConfig, normalizedConfig.rootDir) : apiDatabaseConfig;
                break;
            }
            default:
                break;
        }

        return mergeConfig;
    }, normalizedConfig);

    return normalizedConfig;
}
