module.exports = {
    rootDir: '../..',
    preset: 'ts-jest',
    globals: {
        'ts-jest': {
            // The tsconfig location has to be specified otherwise, it will not transform the javascript
            // files.
            tsConfig: '<rootDir>/tsconfig.settings.json',

            // By default ts-jest reports typescript compilation errors. Let's disable for now diagnostic
            // reporting since some of the packages doesn't pass the typescript compilation.
            diagnostics: false,
        },
    },

    // Global mono-repo code coverage threshold.
    coverageThreshold: {
        global: {
            branches: 80,
            functions: 85,
            lines: 85,
        },
    },

    projects: [
        '<rootDir>/packages/@best/console-stream',
        '<rootDir>/packages/@best/github-integration',
        '<rootDir>/packages/@best/utils',
        '<rootDir>/packages/@best/regex-util',
        '<rootDir>/packages/@best/frontend',
        '<rootDir>/packages/@best/agent',
        '<rootDir>/packages/@best/builder',
        // '<rootDir>/packages/@best/config',
        // '<rootDir>/packages/@best/runner-headless',
        // '<rootDir>/packages/@best/cli',
    ]
};
