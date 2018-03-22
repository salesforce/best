module.exports = {
    projectName: 'simple-benchmarks',
    benchmarkOnClient: true,
    useMacroTaskAfterBenchmark: false,
    "runnerConfig": [
        {
            "runner": "@best/runner-headless",
            "name": "default"
        },
        {
            "runner": '@best/runner-remote',
            "name": "remote",
            "config": {
                "host": "http://localhost:5000",
                "options": { path: '/best' },
                "remoteRunner": "@best/runner-headless"
            }
        }
    ],
};
