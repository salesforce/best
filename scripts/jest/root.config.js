module.exports = {
    rootDir: '../..',

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
        '<rootDir>/packages/@best/config',
        '<rootDir>/packages/@best/builder',
        '<rootDir>/packages/@best/runner-headless',
        '<rootDir>/packages/@best/cli',
    ]
};
