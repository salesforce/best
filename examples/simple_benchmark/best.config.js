module.exports = {
    projectName: 'perf-best-simple-example',
    benchmarkOnClient: true,
    useMacroTaskAfterBenchmark: false,
    benchmarkRunner: '@best/runner-headless',

    // This is for running @best/runner-remote
    // "benchmarkRunnerConfig": {
    //     "host": "http://localhost:5000",
    //     "options": { path: '/best' },
    //     "remoteRunner": "@best/runner-headless"
    // },
};
