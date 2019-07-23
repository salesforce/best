module.exports = {
    projectName: 'best-benchmark',
    "runners": [
        {
            "runner": "@best/runner-headless",
            "alias": "default"
        },
        {
            "runner": "@best/runner-remote",
            "alias": "remote-agent",
            "config": {
                "host": "http://localhost:5000",
                "remoteRunner": "@best/runner-headless"
            }
        },
        {
            "runner": "@best/runner-hub",
            "alias": "heroku-hub",
            "config": {
                "host": "https://bestv4-hub.herokuapp.com",
                "options": {
                    query: {
                        token: process.env.HUB_TOKEN
                    },
                    proxy: "66.91.54.191:8080"
                },
                "spec": {
                    "browser": "chrome",
                    "version": "76"
                }
            }
        }
    ]
};
