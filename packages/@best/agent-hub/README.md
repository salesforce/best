# Best Hub

A best hub represents a remote runner who relies/abstract other best-agents. These are the main benefits of using the agent hub:

1. Abstract clients (projects using best) from configuring specific remotes: you just need the hub address and category in the hub (ex: ie11, chrome, safari)
2. Allows to run concurrently multiple benchmarks, improving performance on projects with many measures.
3. Allows to share resources among different projects: Ex: suppose you have project A, B and C. for each one you have a dedicated chrome best agent running (mA, mB, mC). Project X will always run in machine mX. With the hub, these 3 machines can be shared, and jobs from A, B and C can run in the hub.

## Getting Started

Run it with the following environment variables:

AGENTS_CONFIG="JSON string representing an array of the configurations of each agent behind the hub".

or via a node project (see examples/best-agent-hub)

The configuration of the hub is an array of hubs categories. Each category represents a set of one or more agents that have the same configuration and hardware characteristics, this must be ensured given that a job to be run in the category, can run in any of the agents, and they should return same results.

```javascript
[
    {
        category: 'chrome-73-headless', // Required and unique. Is the remote runner in the client best config.
        remoteRunner: "@best/runner-headless", // Required. The runner that any of the agents should use when running the job. 
        remoteRunnerConfig: {}, // Required (may be an empty object). The Runner config for the remote runner in the agents.
        agents: [ // Required. An array of best agent machines were jobs can run interchangeably obtaining the same results. 
            {
                host: "http://localhost:5000", // Required. Url used to connect to the agent.
                options: { path: "/best" }, // Optional. Connection options to the agent.
            },
            {
                host: "http://localhost:5001",
                options: { path: "/best" },
            },
        ]
    },
    {
        category: "selenium-ie11",
        remoteRunner: "@best/runner-webdriver",
        remoteRunnerConfig: {
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
        },
        agents: [ // Required. An array of best agent machines were jobs can run interchangeably obtaining the same results. 
            {
                host: "http://127.0.0.1:5002",
                options: { path: "/best" },
            }
        ]
    }
];
```

## How to use the hub your project

Add a new runner config section on your best.config:

```javascript
module.exports = {
    projectName: 'simple-benchmark-chrome',
    benchmarkOnClient: true,
    "runnerConfig": [
        {
            "runner": "@best/runner-webdriver",
            "name": "default",
            "config": {
                "webdriverOptions": {
                    "capabilities": {
                        "browserName": "chrome",
                    },
                }
            }
        },
        // Configs to use the hub
        {
            "runner": "@best/runner-remote",
            "name": "remote-chrome",
            "config": {
                "host": "http://localhost:6000",
                "options": { path: "/hub" },
                "runInBatch": true,
                "remoteRunner": "chrome-73-headless",
            }
        },
        {
            "runner": "@best/runner-remote",
            "name": "remote-ie11",
            "config": {
                "host": "http://localhost:6000",
                "options": { path: "/hub" },
                "runInBatch": true,
                "remoteRunner": "selenium-ie11",
            }
        },
    ],
};
```

**Note:** The runInBatch option is specific for a Hub of agents and when enabled will run all your best tests in batches. The number of tests in each batch (3 as maximum) depends on the number of tests your project has. 

Then you can run your measures in your project:

```bash
# Measures in chrome:
best --runner remote-chrome

# Measures in ie11:
best --runner remote-ie11
```
