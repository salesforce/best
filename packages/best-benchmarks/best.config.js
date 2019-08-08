module.exports = {
    projectName: 'best-benchmark',
    metrics: ['script', 'aggregate'],
    runners: [
        {
            runner: "@best/runner-headless",
            alias: "default"
        },
        {
            runner: "@best/runner-hub",
            alias: "heroku-hub",
            config: {
                host: "https://best-public-hub.herokuapp.com",
                options: {
                    query: { token: process.env.BEST_HUB_CLIENT_TOKEN },
                },
                spec: {
                    browser: "chrome",
                    version: "76"
                }
            }
        }
    ]
};
