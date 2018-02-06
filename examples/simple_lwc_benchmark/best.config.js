module.exports = {
    projectName: 'perf-best-examples',
    plugins: {
        'rollup-plugin-lwc-compiler': {
            rootDir: '<rootDir>/src/',
            mode: 'prod', // We don't really need prod here since this is for test best itself
        },
    },
    benchmarkOnClient: false,
    benchmarkRunner: '@best/runner-headless',

    // This is for running @best/runner-remote
    // "benchmarkRunnerConfig": {
    //     "host": "http://localhost:5000",
    //     "options": { path: '/best' },
    //     "remoteRunner": "@best/runner-headless"
    // },
};
