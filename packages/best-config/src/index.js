import path from "path";
import fs from "fs";
import chalk from 'chalk';
import { replacePathSepForRegex } from "best-regex-util";
import { PACKAGE_JSON, BEST_CONFIG } from "./constants";
import { addGitInformation } from "./git";

import DEFAULT_CONFIG from './defaults';

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
        configObject = configObject.best || {};
    }

    if (configObject.rootDir) {
        // We don't touch it if it has an absolute path specified
        if (!path.isAbsolute(configObject.rootDir)) {
            // otherwise, we'll resolve it relative to the file's __dirname
            configObject.rootDir = path.resolve(
                path.dirname(configPath),
                configObject.rootDir,
            );
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
        throw new Error('Config not found');
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
                case 'env':
                    options.testEnvironment = argsCLI[key];
                    break;
                case 'iterations':
                    options.benchmarkIterations = argsCLI[key];
                    break;

                default: break;
            }
            return options;
        }, {});

    return Object.assign({}, initialOptions, argvToOptions);
}

function normalizeRootDir(options) {
    // Assert that there *is* a rootDir
    if (!options.hasOwnProperty('rootDir')) {
        throw new Error(`  Configuration option ${chalk.bold('rootDir')} must be specified.`,);
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
    return options[key].map(pattern =>
        replacePathSepForRegex(normalizeRootDirPattern(pattern, options.rootDir))
    );
}


function normalizeObjectPathPatterns(options, { rootDir }) {
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

function normalizePlugins(plugins, globalOptions) {
    return Object.keys(plugins).reduce((m, plugin) => {
        const pluginOptions = plugins[plugin];
        if (pluginOptions) {
            m[plugin] = normalizeObjectPathPatterns(pluginOptions, globalOptions);
        }
        return m;
    }, {});
}

function normalize(options, argsCLI) {
    options = normalizeRootDir(setFromArgs(options, argsCLI));
    const newOptions = Object.assign({}, DEFAULT_CONFIG);
    Object.keys(options).reduce((newOpts, key) => {
        let value = newOpts[key];
        switch (key) {
            case 'plugins':
                value = normalizePlugins(options[key], options);
                break;
            default: value = options[key];
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
            detectLeaks: options.detectLeaks,
            outputFile: options.outputFile,
            projects: options.projects,
            rootDir: options.rootDir,
            testNamePattern: options.testNamePattern,
            testPathPattern: options.testPathPattern,
            verbose: options.verbose,
            gitCommit: options.gitCommit,
            gitLocalChanges: options.gitLocalChanges
        }),
        projectConfig: Object.freeze({
            cache: options.cache,
            cacheDirectory: options.cacheDirectory,
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

            benchmarkRunner: options.benchmarkRunner,
            benchmarkRunnerConfig: options.benchmarkRunnerConfig,
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
        })
    };
}

export async function readConfig(argsCLI, packageRoot) {
    const customConfigPath = argsCLI.config ? argsCLI.config : packageRoot;
    const configPath = resolveConfigPath(customConfigPath, process.cwd());
    const rawOptions = readConfigAndSetRootDir(configPath);
    const options = normalize(rawOptions, argsCLI);
    try {
        await addGitInformation(options);
    } catch (e) { /*Unable to get git info */ }

    const { globalConfig, projectConfig } = _getConfigs(options);
    return { globalConfig, projectConfig };
}

export async function getConfigs(projectsFromCLIArgs, argv, outputStream) {
    let globalConfig;
    let hasDeprecationWarnings;
    let configs = [];
    let projects = projectsFromCLIArgs;

    if (projectsFromCLIArgs.length === 1) {
        const parsedConfig = await readConfig(argv, projects[0]);

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
        throw new Error("WIP");
    }

    return {
        configs,
        globalConfig,
        hasDeprecationWarnings: !!hasDeprecationWarnings,
    };
}
