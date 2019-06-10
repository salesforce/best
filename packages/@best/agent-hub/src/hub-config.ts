export const config = {
    agents : [
        {
            host: "http://localhost:5000",
            options: { path: "/best" },
            remoteRunner: "@best/runner-headless",
            supportedBrowsers: ['chrome']
        },
        {
            host: "http://localhost:5001",
            options: { path: "/best" },
            remoteRunner: "@best/runner-headless",
            supportedBrowsers: ['chrome']
        },
    ]
};

