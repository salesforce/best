export const check = (argv) => {
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
            'be a JSON encoded value which Jest will use as configuration.',
        type: 'string'
    },
    projects: {
        description:
          'A list of projects that use Jest to run all tests of all ' +
          'projects in a single instance of Jest.',
        type: 'array',
    },
    env: {
        description:
          'The test environment used for all tests. This can point to ' +
          'any file or node module. Examples: `jsdom`, `node` or ' +
          '`path/to/my-environment.js`',
        type: 'string',
    }
};
