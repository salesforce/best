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
