# Best Hub

A Best agent is a machine used to run BEST tests in an isolated environment, ensuring nothing changes. The agent usually runs with an specific best runner (ex: `@best/runner-headless` or `@best/runner-webdriver`) with the specific config

## Starting the agent

## Registration with a hub

When the best agent starts, if `env.HUB_CONFIG` is set, it will try to auto register with the specified hub.

`env.HUB_CONFIG` is a JSON string representing an object in the following form:

```js
const hubConfig = {
    hub: {
        // Hub Connection settings.
        host: 'http://localhost:6000',
        authToken: 'agent token used for authentication with the hub',
        pingTimeout: 180000, // Optional: 180000ms (3 minutes) is the default ping timout.
    },
    agentConfig: {
        spec: {
            // Only benchmarks with this spec can run in this agent.
            browser: 'chrome',
            version: '76',
        },
        host: 'http://localhost:5000', // Required. Url used by the hub to connect to this agent.
        options: { path: '/best' }, // Connection Options
        remoteRunner: '@best/runner-headless', // Required. The runner which this agent will use when running the job.
        remoteRunnerConfig: {}, // Required (may be an empty object). The Runner config for this agent.
    },
};

// set env.HUB_CONFIG=JSON.stringify(hubConfig)
```

### Communication registration process between the agent and the hub

When the agent starts, with a hub config, it will start the communication with the hub in the following protocol:

1. Every `hubConfig.pingTimeout` the agent will do a ping request to the hub, and the hub can reply with
    1. registered=false. In this case the hub will make a request to register with the hub (2)
    2. registered=true. Nothing to do, the hub already has this agent registered.
    3. authentication failed. Any further communication is suspended since the connection token is invalid.
2. Register agent with hub: the hub will return a status.code 201 in case of success, a different status code on failure to register the agent.
