module.exports = {
    testMatch: ['<rootDir>/**/__tests__/*.(spec|test).(ts|js)'],
    // Global mono-repo code coverage threshold.
    coverageThreshold: {
        global: {
            branches: 80,
            functions: 85,
            lines: 85,
        },
    },
};
