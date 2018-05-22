module.exports = {
    projectName: 'simple-benchmark-ie11',
    plugins: ['rollup-plugin-compat'],
    benchmarkOnClient: true,
    benchmarkMinIterations: 10,
    useMacroTaskAfterBenchmark: false,
    "runnerConfig": [
        {
        "runner": "@best/runner-ie11",
            "name": "default",
            "config": {
                "host": 'localhost',
                "port": '4444'
            }
        },
        {
            "runner": '@best/runner-remote',
            "name": "remote",
            "config": {
                "host": "http://localhost:5000",
                "options": { path: '/best' },
                "remoteRunner": "@best/runner-ie11"
            }
        }
    ],
};