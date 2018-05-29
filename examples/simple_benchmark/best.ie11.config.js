module.exports = {
    projectName: 'simple-benchmark-ie11',
    plugins: ['rollup-plugin-compat'],
    benchmarkOnClient: true,
    "runnerConfig": [
        {
        "runner": "@best/runner-webdriver",
            "name": "default",
            "config": {
                "webdriverOptions": {
                    "desiredCapabilities": {
                        "platform": "WINDOWS",
                        "browserName": "internet explorer",
                        "version": "11",
                        "ignoreZoomSetting": true,
                        "initialBrowserUrl": "about:blank",
                        "nativeEvents": false,
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
                        "platform": "WINDOWS",
                        "browserName": "internet explorer",
                        "version": "11",
                        "ignoreZoomSetting": true,
                        "initialBrowserUrl": "about:blank",
                        "nativeEvents": false,
                    }
                }
            }
        }
    ],
};