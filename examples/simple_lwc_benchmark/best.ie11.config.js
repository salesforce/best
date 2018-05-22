module.exports = {
    projectName: 'lwc-examples-ie11',
    plugins: [
        '<rootDir>/custom-rollup-transformer/empty-example.js',
        ['rollup-plugin-lwc-compiler', {
            rootDir: '<rootDir>/src/',
            mode: 'compat', // We don't really need prod here since this is for test best itself
        }]
    ],
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