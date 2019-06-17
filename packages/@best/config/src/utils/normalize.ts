import path from 'path';
import chalk from 'chalk';
import { BestCliOptions, RawBestConfig, DefaultProjectOptions, RunnerConfig } from '../internal-types';
import DEFAULT_CONFIG from './defaults';
import { replacePathSepForRegex } from '@best/regex-util';

const TARGET_COMMIT = process.env.TARGET_COMMIT;
const BASE_COMMIT = process.env.BASE_COMMIT;

function normalizeModulePathPatterns(options: any, key: string) {
    return options[key].map((pattern: any) => replacePathSepForRegex(normalizeRootDirPattern(pattern, options.rootDir)));
}

function normalizeRunnerConfig(runnerConfig: RunnerConfig | RunnerConfig[], { runner }: RawBestConfig) {
    if (!Array.isArray(runnerConfig)) {
        runnerConfig = [runnerConfig];
    }

    const defaultRunners = runnerConfig.filter((c: RunnerConfig) => c.alias === undefined || c.alias === 'default');
    if (defaultRunners.length > 1) {
        throw new Error('Wrong configuration: More than one default configuration declared');
    }

    const match = runnerConfig.find((c: RunnerConfig) => c.alias === runner) || defaultRunners[0] || {};
    return match;
}

function setCliOptionOverrides(initialOptions: RawBestConfig, argsCLI: BestCliOptions): RawBestConfig {
    const argvToOptions = Object.keys(argsCLI)
        .reduce((options: any, key: string) => {
            switch (key) {
                case 'disableInteractive':
                    options.isInteractive = argsCLI[key] !== undefined ? false : undefined;
                    break;
                case 'iterations':
                    options.benchmarkIterations = argsCLI[key];
                    break;
                case 'compareStats':
                    options.compareStats = argsCLI.compareStats && argsCLI.compareStats.filter(Boolean);
                    break;
                default:
                    options[key] = argsCLI[key];
                    break;
            }
            return options;
        }, {});

    return Object.assign({}, initialOptions, argvToOptions);
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

function normalizePlugins(plugins: any, { rootDir }: RawBestConfig) {
    return plugins.map((plugin: any) => {
        if (typeof plugin === 'string') {
            return normalizeRootDirPattern(plugin, rootDir);
        } else if (Array.isArray(plugin)) {
            return [normalizeRootDirPattern(plugin[0], rootDir), normalizeObjectPathPatterns(plugin[1], rootDir)];
        }
        return plugin;
    });
}

function normalizeRootDir(options: any): any {
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

function normalizeTestPathPattern(argsCLI: any) {
    const patterns = [];
    if (argsCLI._) {
        patterns.push(...argsCLI._);
    }

    if (argsCLI.testPathPattern) {
        patterns.push(...argsCLI.testPathPattern);
    }

    const testPathPattern = patterns.map(replacePathSepForRegex).join('|');
    return testPathPattern;
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

export function normalizeConfig(options: RawBestConfig, cliOptions: BestCliOptions): DefaultProjectOptions {
    options = normalizeRootDir(setCliOptionOverrides(options, cliOptions));
    const defaultProjectOptions: DefaultProjectOptions = { ...DEFAULT_CONFIG };

    Object.keys(options).reduce((newOpts: any, key) => {
        let value = newOpts[key];
        switch (key) {
            case 'projects':
                value = normalizeModulePathPatterns(options, key);
                break;
            case 'plugins':
                value = normalizePlugins(options[key], options);
                break;
            case 'runnerConfig':
                value = normalizeRunnerConfig(options[key], options);
                break;
            case 'compareStats':
                value = options[key] !== undefined && normalizeCommits(options[key]);
                break;
            default:
                value = options[key];
        }
        defaultProjectOptions[key] = value;
        return newOpts;
    }, defaultProjectOptions);

    defaultProjectOptions.nonFlagArgs = cliOptions._;
    defaultProjectOptions.testPathPattern = normalizeTestPathPattern(cliOptions);
    return defaultProjectOptions;
}
