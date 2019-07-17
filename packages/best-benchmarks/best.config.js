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
        },
        {
            "runner": "@best/runner-hub",
            "alias": "hub",
            "config": {
                "host": "http://localhost:5555",
                "options": {
                    path: "/hub",
                    query: {
                        token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzY29wZSI6ImNsaWVudCIsImlhdCI6MTU2MzI5NjkyMywiZXhwIjoxNTY1ODg4OTIzfQ.3TN91ySnte8_dhJ1Iabe4fUcOvS7lp9J700YywCMC5Q"
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
