module.exports = {
    projectName: 'simple-benchmark-chrome',
    benchmarkOnClient: true,
    "runnerConfig": [
        {
        "runner": "@best/runner-webdriver",
            "name": "default",
            "config": {
                "webdriverOptions": {
                    "desiredCapabilities": {
                        "browserName": "chrome",
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
                        "browserName": "chrome",
                    },
                }
            }
        }
    ],
};