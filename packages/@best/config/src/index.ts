/*
 * Copyright (c) 2019, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: MIT
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/MIT
*/

import { resolveConfigPath, readConfigAndSetRootDir, ensureNoDuplicateConfigs } from './utils/resolve-config';
import { getGitInfo } from './utils/git';
import { normalizeConfig, normalizeRootDirPattern } from './utils/normalize';
import { GitConfig, CliConfig, NormalizedConfig, FrozenProjectConfig, FrozenGlobalConfig, ProjectConfigs } from '@best/types';

function generateProjectConfigs(options: NormalizedConfig, isRoot: boolean, gitInfo?: GitConfig): { projectConfig: FrozenProjectConfig, globalConfig: FrozenGlobalConfig | undefined } {
    let globalConfig: FrozenGlobalConfig | undefined;

    if (isRoot) {
        if (!gitInfo) {
            throw new Error('Unable to read git information');
        }

        globalConfig = Object.freeze({
            gitIntegration: options.gitIntegration,
            generateHTML: options.generateHTML,
            compareStats: options.compareStats,
            externalStorage: options.externalStorage,
            apiDatabase: options.apiDatabase,
            commentThreshold: options.commentThreshold,
            projects: options.projects,
            rootDir: options.rootDir,
            rootProjectName: options.projectName,
            runInBand: options.runInBand,
            nonFlagArgs: options.nonFlagArgs,
            gitInfo: gitInfo,
            isInteractive: options.isInteractive,
        });
    }

    const projectConfig: FrozenProjectConfig = Object.freeze({
        cache: options.cache,
        cacheDirectory: options.cacheDirectory,
        useHttp: options.useHttp,
        assets: options.assets,
        moduleDirectories: options.moduleDirectories,
        moduleFileExtensions: options.moduleFileExtensions,
        plugins: options.plugins,
        rootDir: options.rootDir,
        projectName: options.projectName,
        metrics: options.metrics,
        runInBatch: options.runInBatch,
        benchmarkRunner: options.runner,
        benchmarkRunnerConfig: options.runnerConfig,
        benchmarkEnvironment: options.benchmarkEnvironment,
        benchmarkEnvironmentOptions: options.benchmarkEnvironmentOptions,
        benchmarkMaxDuration: options.benchmarkMaxDuration,
        benchmarkMinIterations: options.benchmarkMinIterations,
        benchmarkIterations: options.benchmarkIterations,
        benchmarkOnClient: options.benchmarkOnClient,
        benchmarkOutput: normalizeRootDirPattern(options.benchmarkOutput, options.rootDir),
        benchmarkCustomAssets: normalizeRootDirPattern(options.benchmarkCustomAssets, options.rootDir),
        testMatch: options.testMatch,
        testPathIgnorePatterns: options.testPathIgnorePatterns,
        samplesQuantileThreshold: options.samplesQuantileThreshold
    });

    return { globalConfig, projectConfig };
}

export async function readConfig(cliOptions: CliConfig, packageRoot: string, parentConfigPath?: string): Promise<{ configPath: string, globalConfig?: FrozenGlobalConfig, projectConfig: FrozenProjectConfig }> {
    const configPath = resolveConfigPath(packageRoot, process.cwd());
    const userConfig = readConfigAndSetRootDir(configPath);
    const options = normalizeConfig(userConfig, cliOptions);
    let gitConfig;

    // If we have a parent Config path, we are in a nested/project best config
    if (!parentConfigPath) {
        try {
            gitConfig = await getGitInfo(options.rootDir);
        } catch (e) {
            console.log('[WARN] - Unable to get git information');
            /* Unable to get git info */
        }
    }

    const { globalConfig, projectConfig } = generateProjectConfigs(options, !parentConfigPath, gitConfig);
    return { configPath, globalConfig, projectConfig };
}

export async function getConfigs(projectsFromCLIArgs: string[], cliOptions: CliConfig): Promise<ProjectConfigs> {
    let globalConfig: FrozenGlobalConfig | undefined;
    let configs: FrozenProjectConfig[] = [];
    let projects: string[] = [];
    let configPath: string;

    // We first read the main config
    if (projectsFromCLIArgs.length === 1) {
        const parsedConfigs = await readConfig(cliOptions, projectsFromCLIArgs[0]);
        configPath = parsedConfigs.configPath;
        const { globalConfig: parsedGlobalConfig } = parsedConfigs;

        if (!parsedGlobalConfig) {
            throw new Error('Global configuration must exist');
        }

        if (parsedGlobalConfig && parsedGlobalConfig.projects) {
            // If this was a single project, and its config has `projects`
            // settings, use that value instead.
            projects = parsedGlobalConfig.projects;
        }

        globalConfig = parsedGlobalConfig;
        configs = [parsedConfigs.projectConfig];

        if (globalConfig.projects && globalConfig.projects.length) {
            // Even though we had one project in CLI args, there might be more
            // projects defined in the config.
            projects = globalConfig.projects;
        }
    }

    if (projects.length > 1) {
        const parsedConfigs = await Promise.all(projects.map(root => readConfig(cliOptions, root, configPath)));
        ensureNoDuplicateConfigs(parsedConfigs, projects);
        configs = parsedConfigs.map(({ projectConfig }) => projectConfig);
    }

    if (!globalConfig) {
        throw new Error('Global configuration not defined');
    }

    return {
        configs,
        globalConfig,
    };
}
