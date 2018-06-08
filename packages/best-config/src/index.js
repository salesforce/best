import fs from 'fs';
import path from 'path';
import chalk from 'chalk';
import { replacePathSepForRegex } from '@best/regex-util';

import DEFAULT_CONFIG from './defaults';
import { addGitInformation } from './git';
import { PACKAGE_JSON, BEST_CONFIG } from './constants';

const TARGET_COMMIT = process.env.TARGET_COMMIT;
const BASE_COMMIT = process.env.BASE_COMMIT;
const specialArgs = ['_', '$0', 'h', 'help', 'config'];
const isFile = filePath => fs.existsSync(filePath) && !fs.lstatSync(filePath).isDirectory();

function readConfigAndSetRootDir(configPath) {
    const isJSON = configPath.endsWith('.json');
    let configObject;
    try {
        configObject = require(configPath);
    } catch (error) {
        if (isJSON) {
            throw new Error(`Best: Failed to parse config file ${configPath}\n`);
        } else {
            throw error;
        }
    }

    if (configPath.endsWith(PACKAGE_JSON)) {
        if (!configObject.best) {
            throw new Error(`No "best" section has been found in ${configPath}`);
        }

        configObject = configObject.best;
    }

    if (!configObject) {
        throw new Error("Couldn't find any configuration for Best.");
    }

    if (configObject.rootDir) {
        // We don't touch it if it has an absolute path specified
        if (!path.isAbsolute(configObject.rootDir)) {
            // otherwise, we'll resolve it relative to the file's __dirname
            configObject.rootDir = path.resolve(path.dirname(configPath), configObject.rootDir);
        }
    } else {
        // If rootDir is not there, we'll set it to this file's __dirname
        configObject.rootDir = path.dirname(configPath);
    }

    return configObject;
}

function resolveConfigPathByTraversing(pathToResolve, initialPath, cwd) {
    const bestConfig = path.resolve(pathToResolve, BEST_CONFIG);
    if (isFile(bestConfig)) {
        return bestConfig;
    }

    const packageJson = path.resolve(pathToResolve, PACKAGE_JSON);
    if (isFile(packageJson)) {
        return packageJson;
    }

    if (pathToResolve === path.dirname(pathToResolve)) {
        throw new Error(`No config found in ${initialPath}`);
    }

    // go up a level and try it again
    return resolveConfigPathByTraversing(path.dirname(pathToResolve), initialPath, cwd);
}

function resolveConfigPath(pathToResolve, cwd) {
    const absolutePath = path.isAbsolute(pathToResolve) ? pathToResolve : path.resolve(cwd, pathToResolve);
    if (isFile(absolutePath)) {
        return absolutePath;
    }

    return resolveConfigPathByTraversing(absolutePath, pathToResolve, cwd);
}

function setFromArgs(initialOptions, argsCLI) {
    const argvToOptions = Object.keys(argsCLI)
        .filter(key => argsCLI[key] !== undefined && specialArgs.indexOf(key) === -1)
        .reduce((options, key) => {
            switch (key) {
                case 'iterations':
                    options.benchmarkIterations = argsCLI[key];
                    break;
                case 'compareStats':
                    options[key] = argsCLI[key].filter(Boolean);
                    break;
                default:
                    options[key] = argsCLI[key];
                    break;
            }
            return options;
        }, {});

    return Object.assign({}, initialOptions, argvToOptions);
}

function normalizeRootDir(options) {
    // Assert that there *is* a rootDir
    if (!options.hasOwnProperty('rootDir')) {
        throw new Error(`  Configuration option ${chalk.bold('rootDir')} must be specified.`);
    }

    options.rootDir = path.normalize(options.rootDir);
    return options;
}

function buildTestPathPattern(argsCLI) {
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

function normalizeRootDirPattern(str, rootDir) {
    return str.replace(/<rootDir>/g, rootDir);
}

function normalizeUnmockedModulePathPatterns(options, key) {
    return options[key].map(pattern => replacePathSepForRegex(normalizeRootDirPattern(pattern, options.rootDir)));
}

function normalizeObjectPathPatterns(options, rootDir) {
    return Object.keys(options).reduce((m, key) => {
        const value = options[key];
        if (typeof value === 'string') {
            m[key] = normalizeRootDirPattern(value, rootDir);
        } else {
            m[key] = value;
        }
        return m;
    }, {});
}

function normalizePlugins(plugins, { rootDir }) {
    return plugins.map((plugin) => {
        if (typeof plugin === 'string') {
            return normalizeRootDirPattern(plugin, rootDir);
        } else if (Array.isArray(plugin)) {
            return [plugin[0], normalizeObjectPathPatterns(plugin[1], rootDir)];
        }
        return plugin;
    });
}

function normalizeRunnerConfig(runnerConfig, { runner }) {
    if (!Array.isArray(runnerConfig)) {
        runnerConfig = [runnerConfig];
    }

    const defaultRunners = runnerConfig.filter(c => c.name === undefined || c.name === 'default');
    if (defaultRunners > 1) {
        throw new Error('Wrong configuration: More than one default configuration declared');
    }

    const match = runnerConfig.find(c => c.name === runner) || defaultRunners[0] || {};

    return match;
}

function normalizeCommits([base, target]) {
    base = (base || BASE_COMMIT || '');
    target = (target || TARGET_COMMIT || '');
    return [base.slice(0, 7), target.slice(0, 7)];
}

function normalizePattern(names) {
    if (typeof names === 'string') {
        names = names.split(',');
    }
    if (names instanceof Array) {
        names = names.map(name => name.replace(/\*/g, '.*'));
        names = new RegExp(`^(${names.join('|')})$`);
    }
    if (!(names instanceof RegExp)) {
        throw new Error(`  Names must be provided as a string, array or regular expression.`);
    }
    return typeof names === 'string' ? new RegExp(names) : names;
}

function normalize(options, argsCLI) {
    options = normalizeRootDir(setFromArgs(options, argsCLI));
    const newOptions = Object.assign({}, DEFAULT_CONFIG);
    Object.keys(options).reduce((newOpts, key) => {
        let value = newOpts[key];
        switch (key) {
            case 'staticFiles':
                value = normalizeObjectPathPatterns(options[key], options.rootDir);
                break;
            case 'projects':
                value = normalizeUnmockedModulePathPatterns(options, key);
                break;
            case 'plugins':
                value = normalizePlugins(options[key], options);
                break;
            case 'runnerConfig':
                value = normalizeRunnerConfig(options[key], options);
                break;
            case 'compareStats':
                value = options[key].length ? normalizeCommits(options[key], options) : undefined;
                break;
            default:
                value = options[key];
        }
        newOptions[key] = value;
        return newOpts;
    }, newOptions);

    newOptions.nonFlagArgs = argsCLI._;
    newOptions.testPathPattern = buildTestPathPattern(argsCLI);
    return newOptions;
}

function _getConfigs(options) {
    return {
        globalConfig: Object.freeze({
            gitIntegration: options.gitIntegration,
            detectLeaks: options.detectLeaks,
            compareStats: options.compareStats,
            outputFile: options.outputFile,
            externalStorage: options.externalStorage,
            projects: options.projects,
            rootDir: options.rootDir,
            rootProjectName: options.projectName,
            nonFlagArgs: options.nonFlagArgs,
            testNamePattern: options.testNamePattern,
            testPathPattern: options.testPathPattern,
            verbose: options.verbose,
            openBenchmarks: options.openBenchmarks,
            gitCommit: options.gitCommit,
            gitLocalChanges: options.gitLocalChanges,
            gitBranch: options.gitBranch,
            gitRepository: options.gitRepository,
            normalize: options.normalize,
            outputMetricPattern: normalizePattern(options.outputMetricNames),
            outputTotals: options.outputTotals,
            outputHistograms: options.outputHistograms,
            outputHistogramPattern: normalizePattern(options.outputHistogramNames),
            histogramQuantileRange: options.histogramQuantileRange,
            histogramMaxWidth: options.histogramMaxWidth,
        }),
        projectConfig: Object.freeze({
            cache: options.cache,
            cacheDirectory: options.cacheDirectory,
            staticFiles: options.staticFiles,
            cwd: options.cwd,
            detectLeaks: options.detectLeaks,
            displayName: options.displayName,
            globals: options.globals,
            moduleDirectories: options.moduleDirectories,
            moduleFileExtensions: options.moduleFileExtensions,
            moduleLoader: options.moduleLoader,
            moduleNameMapper: options.moduleNameMapper,
            modulePathIgnorePatterns: options.modulePathIgnorePatterns,
            modulePaths: options.modulePaths,
            name: options.name,
            plugins: options.plugins,
            rootDir: options.rootDir,
            roots: options.roots,

            projectName: options.projectName,
            benchmarkRunner: options.runnerConfig.runner || options.runner,
            benchmarkRunnerConfig: options.runnerConfig.config || options.runnerConfig,
            benchmarkEnvironment: options.benchmarkEnvironment,
            benchmarkEnvironmentOptions: options.benchmarkEnvironmentOptions,
            benchmarkMaxDuration: options.benchmarkMaxDuration,
            benchmarkMinIterations: options.benchmarkMinIterations,
            benchmarkIterations: options.benchmarkIterations,
            benchmarkOnClient: options.benchmarkOnClient,
            benchmarkOutput: normalizeRootDirPattern(options.benchmarkOutput, options.rootDir),

            testMatch: options.testMatch,
            testPathIgnorePatterns: options.testPathIgnorePatterns,
            testRegex: options.testRegex,
            testURL: options.testURL,
            transform: options.transform,
            transformIgnorePatterns: options.transformIgnorePatterns,

            samplesQuantileThreshold: options.samplesQuantileThreshold,
        }),
    };
}

const ensureNoDuplicateConfigs = (parsedConfigs, projects) => {
    const configPathSet = new Set();

    for (const { configPath } of parsedConfigs) {
        if (configPathSet.has(configPath)) {
            let message = 'One or more specified projects share the same config file\n';

            parsedConfigs.forEach((projectConfig, index) => {
                message =
                    message +
                    '\nProject: "' +
                    projects[index] +
                    '"\nConfig: "' +
                    String(projectConfig.configPath) +
                    '"';
            });
            throw new Error(message);
        }

        if (configPath !== null) {
            configPathSet.add(configPath);
        }
    }
};

export async function readConfig(argsCLI, packageRoot, parentConfigPath) {
    const customConfigPath = argsCLI.config ? argsCLI.config : packageRoot;
    const configPath = resolveConfigPath(customConfigPath, process.cwd());
    const rawOptions = readConfigAndSetRootDir(configPath);
    const options = normalize(rawOptions, argsCLI);

    // We assume all projects are within the same mono-repo
    // No need to get version control status again
    if (!parentConfigPath) {
        try {
            await addGitInformation(options);
        } catch (e) {
            console.log('[WARN] - Unable to get git information');
            /* Unable to get git info */
        }
    }

    const { globalConfig, projectConfig } = _getConfigs(options);
    return { configPath, globalConfig, projectConfig };
}

export async function getConfigs(projectsFromCLIArgs, argv) {
    let globalConfig;
    let hasDeprecationWarnings;
    let configs = [];
    let projects = projectsFromCLIArgs;
    let configPath;

    if (projectsFromCLIArgs.length === 1) {
        const parsedConfig = await readConfig(argv, projects[0]);
        configPath = parsedConfig.configPath;

        if (parsedConfig.globalConfig.projects) {
            // If this was a single project, and its config has `projects`
            // settings, use that value instead.
            projects = parsedConfig.globalConfig.projects;
        }

        hasDeprecationWarnings = parsedConfig.hasDeprecationWarnings;
        globalConfig = parsedConfig.globalConfig;
        configs = [parsedConfig.projectConfig];

        if (globalConfig.projects && globalConfig.projects.length) {
            // Even though we had one project in CLI args, there might be more
            // projects defined in the config.
            projects = globalConfig.projects;
        }
    }

    if (projects.length > 1) {
        const parsedConfigs = await Promise.all(projects.map(root => readConfig(argv, root, configPath)));
        ensureNoDuplicateConfigs(parsedConfigs, projects);
        configs = parsedConfigs.map(({ projectConfig }) => projectConfig);

        if (!globalConfig) {
            globalConfig = parsedConfigs[0].globalConfig;
        }

        if (!globalConfig || !configs.length) {
            throw new Error('best: No configuration found for any project.');
        }
    }

    return {
        configs,
        globalConfig,
        hasDeprecationWarnings: !!hasDeprecationWarnings,
    };
}
