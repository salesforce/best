module.exports = {
    projectName: 'simple-benchmark-compat',
    plugins: ['rollup-plugin-compat'],
    benchmarkOnClient: true,
    useMacroTaskAfterBenchmark: false,
    "runnerConfig": [
        {
            "runner": "@best/runner-headless",
            "name": "default"
        },
        {
            "runner": '@best/runner-remote',
            "name": "local",
            "config": {
                "host": "http://localhost:5000",
                "options": { path: '/best' },
                "remoteRunner": "@best/runner-headless"
            }
        }
    ],
};
