module.exports = {
    projectName: 'lwc-examples-firefox',
    plugins: [
        '<rootDir>/custom-rollup-transformer/empty-example.js',
        ['rollup-plugin-lwc-compiler', {
            rootDir: '<rootDir>/src/',
            mode: 'compat', // We don't really need prod here since this is for test best itself
        }]
    ],
    benchmarkOnClient: true,
    "runnerConfig": [
        {
        "runner": "@best/runner-webdriver",
            "name": "default",
            "config": {
                "webdriverOptions": {
                    "desiredCapabilities": {
                        "browserName": "firefox",
                    },
                }
            }
        },
        {
            "runner": "@best/runner-remote",
            "name": "remote",
            "config": {
                "host": "http://localhost:5000",
                "options": { path: "/best" },
                "remoteRunner": "@best/runner-webdriver",
                "webdriverOptions": {
                    "desiredCapabilities": {
                        "browserName": "firefox",
                    },
                }
            }
        }
    ],
};