
import { resolveConfigPath, readConfigAndSetRootDir, ensureNoDuplicateConfigs } from './utils/resolve-config';
import { getGitInfo, GitInfo } from './utils/git';
import { normalizeConfig, normalizeRegexPattern, normalizeRootDirPattern } from './utils/normalize';
import { BestCliOptions, DefaultProjectOptions, GlobalConfig, ProjectConfig } from './types';
export { BestCliOptions };

function generateProjectConfigs(options: DefaultProjectOptions, isRoot: boolean, gitInfo?: GitInfo): { projectConfig: ProjectConfig, globalConfig: GlobalConfig | undefined } {
    let globalConfig: GlobalConfig | undefined = undefined;
    let projectConfig: ProjectConfig;

    if (isRoot) {
        globalConfig = Object.freeze({
            gitIntegration: options.gitIntegration,
            detectLeaks: options.detectLeaks,
            compareStats: options.compareStats,
            outputFile: options.outputFile,
            externalStorage: options.externalStorage,
            apiDatabase: options.apiDatabase,
            projects: options.projects,
            rootDir: options.rootDir,
            rootProjectName: options.projectName,
            nonFlagArgs: options.nonFlagArgs,
            testNamePattern: options.testNamePattern,
            testPathPattern: options.testPathPattern,
            verbose: options.verbose,
            gitInfo: gitInfo,
            gitCommit: options.gitCommit,
            gitCommitDate: options.gitCommitDate,
            gitLocalChanges: options.gitLocalChanges,
            gitBranch: options.gitBranch,
            gitRepository: options.gitRepository,
            normalize: options.normalize,
            outputMetricPattern: normalizeRegexPattern(options.outputMetricNames),
            outputTotals: options.outputTotals,
            outputHistograms: options.outputHistograms,
            outputHistogramPattern: normalizeRegexPattern(options.outputHistogramNames),
            histogramQuantileRange: options.histogramQuantileRange,
            histogramMaxWidth: options.histogramMaxWidth,
            openPages: options.openPages,
        });
    }

    projectConfig = Object.freeze({
        cache: options.cache,
        cacheDirectory: options.cacheDirectory,
        useHttp: options.useHttp,
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
    });

    return { globalConfig, projectConfig };
}

export async function readConfig(cliOptions: BestCliOptions, packageRoot: string, parentConfigPath?: string): Promise<{ configPath: string, globalConfig?: GlobalConfig, projectConfig: ProjectConfig }> {
    const configPath = resolveConfigPath(cliOptions.config ? cliOptions.config : packageRoot, process.cwd());
    const rawOptions = readConfigAndSetRootDir(configPath);
    const options = normalizeConfig(rawOptions, cliOptions);
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

export async function getConfigs(projectsFromCLIArgs: string[], cliOptions: BestCliOptions): Promise<{ globalConfig: GlobalConfig, configs: ProjectConfig[] }> {
    let globalConfig: GlobalConfig | undefined;
    let configs: ProjectConfig[] = [];
    let projects: string[] = [];
    let configPath: string;

    // We first read the main config
    if (projectsFromCLIArgs.length === 1) {
        const parsedConfigs = await readConfig(cliOptions, projects[0]);
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
        globalConfig = parsedConfigs[0].globalConfig;
    }

    if (!globalConfig) {
        throw new Error('Global configuration not defined');
    }

    return {
        configs,
        globalConfig,
    };
}
