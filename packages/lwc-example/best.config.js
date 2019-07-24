module.exports = {
    projectName: 'lwc-example',
    plugins: [
        ['@lwc/rollup-plugin', {
            rootDir: '<rootDir>/src/'
        }],
        ['rollup-plugin-replace', { 'process.env.NODE_ENV': JSON.stringify('production') }]
    ],
    "runners": [
        {
            "runner": "@best/runner-headless",
            "alias": "default"
        },
        {
            "runner": "@best/runner-remote",
            "alias": "heroku-agent",
            "config": {
                "host": "http://bestv4-agent.herokuapp.com",
                "remoteRunner": "@best/runner-headless"
            }
        },
        {
            "runner": "@best/runner-hub",
            "alias": "heroku-hub",
            "config": {
                "host": "http://bestv4-hub.herokuapp.com",
                "options": {
                    query: {
                        token: process.env.HUB_TOKEN
                    }
                },
                "spec": {
                    "browser": "chrome",
                    "version": "76"
                }
            }
        }
    ]
};
