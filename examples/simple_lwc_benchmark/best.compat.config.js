module.exports = {
    projectName: 'lwc-examples-compat',
    plugins: [
        '<rootDir>/custom-rollup-transformer/empty-example.js',
        ['rollup-plugin-lwc-compiler', {
            rootDir: '<rootDir>/src/',
            mode: 'compat', // We don't really need prod here since this is for test best itself
        }]
    ],
    benchmarkOnClient: false,
    benchmarkRunner: '@best/runner-headless',

    // This is for running @best/runner-remote
    // "benchmarkRunnerConfig": {
    //     "host": "http://localhost:5000",
    //     "options": { path: '/best' },
    //     "remoteRunner": "@best/runner-headless"
    // },
};
