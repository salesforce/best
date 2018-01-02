module.exports = {
    plugins: {
        "rollup-plugin-lwc-compiler": {
            "rootDir": "<rootDir>/src/"
        }
    },
    "benchmarkOnClient": false,
    "benchmarkRunner": "best-runner-headless",
    "benchmarkRunnerConfig": {
        "host": "http://localhost:5000",
        "options": { path: '/best' },
        "remoteRunner": "best-runner-headless"
    }
};
