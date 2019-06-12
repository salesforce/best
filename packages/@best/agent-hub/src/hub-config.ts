export const config = [
    {
        category: 'chrome-73-headless',
        remoteRunner: "@best/runner-headless",
        remoteRunnerConfig: {},
        agents: [
            {
                host: "http://localhost:5000",
                options: { path: "/best" },
            },
            {
                host: "http://localhost:5001",
                options: { path: "/best" },
            },
        ]
    }
];
