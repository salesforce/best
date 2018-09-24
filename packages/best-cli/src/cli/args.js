export const check = () => {
    // TODO: Implement checks
    return true;
};

export const usage = 'Usage: $0 [--config=<pathToConfigFile>] [BenchmarkPathPattern]';
export const docs = 'Documentation: https://best.lwcjs.org';

export const options = {
    config: {
        alias: 'c',
        description:
            'The path to a best config file specifying how to find ' +
            'and execute benchmark runs. If no rootDir is set in the config, the current ' +
            'directory is assumed to be the rootDir for the project. This can also ' +
            'be a JSON encoded value which Best will use as configuration.',
        type: 'string',
    },
    projects: {
        description:
            'A list of projects to run. ' +
            'The arguments must be paths to best config files or a local repo with best configured',
        type: 'array',
    },
    iterations: {
        description: 'Define the number of iterations to run for all the benchmarks',
        type: 'number',
    },
    clearCache: {
        default: undefined,
        description:
            'Clears the configured Jest cache directory and then exits. ' +
            'Default directory can be found by calling jest --showConfig',
        type: 'boolean',
    },
    clearResults: {
        default: undefined,
        description: 'Clear all generated benchmarks from the `benchmarkOutput` folder',
        type: 'boolean',
    },
    externalStorage: {
        default: undefined,
        description:
            'This option allows to save the results in an arbitrary storage system.' +
            'This storage must be a node module that exports a function ' +
            'called `storeResults`, expecting benchmarkResults as the first argument ' +
            'and a globalConfig as the second argument',
        type: 'string',
    },
    compareStats: {
        description:
            'Compares two benchmark runs for a given commit. ' +
            'If --externalStorage is provided it will use that source' +
            'Otherwise it will try to find the results on the file system',
        type: 'array',
    },
    gitIntegration: {
        default: undefined,
        description: 'Integrates with Git, posting the results of the benchmark or comparison',
        type: 'boolean',
    },
    runner: {
        default: 'default',
        description:
            'Select the runner to execute the benchmarks.' +
            'Make sure you have defined `runnerConfig` options in your Best config file' +
            'By default it will use @best/runner-headless',
        type: 'string',
    },
    runnerConfig: {
        default: undefined,
        description: 'JSON representation of the configuration to use for the give runner',
        type: 'string',
    },
    useHttp: {
        default: true,
        description: 'Runs benchmarks against a temporary HTTP server (instead of using the "file:" protocol).',
        type: 'boolean',
    }
};
