module.exports = {
    projectName: 'simple-benchmark-prod',
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
        },
        {
            "runner": '@best/runner-remote',
            "name": "remote",
            "config": {
                "host": "http://best-agent-pool.lwcjs.org/",
                "options": { path: '/best' },
                "remoteRunner": "@best/runner-headless"
            }
        }
    ],
};
