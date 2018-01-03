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
        type: 'string'
    },
    projects: {
        description:
            'A list of projects that use Best to run all tests of all ' +
            'projects in a single instance of Best.',
        type: 'array',
    },
    iterations: {
        description:
            'Define the number of iterations to run for all the benchmarks',
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
        description:
            'Clear all generated benchmarks from the `benchmarkOutput` folder',
        type: 'boolean',
    },
    externalStorage: {
        default: undefined,
        description:
            'This option allows to save the results in an arbitrary storage system.' +
            'This strage must be a node module that exports a function ' +
            'called `storeResults`, expecting benchmarkResults as the first argument ' +
            'and a globalConfig as the second argument',
        type: 'string',
    }
};
