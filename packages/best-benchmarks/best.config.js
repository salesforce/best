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
                "options": { path: "/best" },
                "remoteRunner": "@best/runner-headless"
            }
        }
    ],
};
