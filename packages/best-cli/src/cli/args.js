export const check = (argv) => {
    // TODO: Implement stuff
};

export const usage = 'Usage: $0 [--config=<pathToConfigFile>] [BenchmarkPathPattern]';
export const docs = 'Documentation: https://best.lwcjs.org';

export const options = {
    all: {
        default: undefined,
        description: 'Test'
    },
    config: {
        alias: 'c',
        description:
            'The path to a best config file specifying how to find ' +
            'and execute benchmark runs. If no rootDir is set in the config, the current ' +
            'directory is assumed to be the rootDir for the project. This can also ' +
            'be a JSON encoded value which Jest will use as configuration.',
        type: 'string'
    }
};
