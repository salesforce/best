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
                "host": "http://localhost:6000",
                "options": {
                    path: "/hub",
                    query: {
                        token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzY29wZSI6ImNsaWVudCIsImlhdCI6MTU2MTYwNzI1OCwiZXhwIjoxNTY0MTk5MjU4fQ.BER-PIIlsf6NWNBctWrmS1YWB4QkI2aYiNp0BE6aASU'
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
