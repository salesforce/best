module.exports = {
    projectName: 'simple-benchmarks',
    benchmarkOnClient: true,
    useMacroTaskAfterBenchmark: false,
    benchmarkRunner: '@best/runner-headless',
    // benchmarkRunner: '@best/runner-remote',

    // This is for running @best/runner-remote
    // "benchmarkRunnerConfig": {
    //     "host": "http://localhost:5000",
    //     "options": { path: '/best' },
    //     "remoteRunner": "@best/runner-headless"
    // },
};
