# Best Hub

A best hub represents a remote runner who relies/abstract other best-agents. These are the main benefits of using the agent hub:

1. Abstract clients (projects using best) from configuring specific remotes: you just need the hub address, an authorization token, and specify the browser name and version to run the tests.
2. Allows to run concurrently multiple benchmarks, improving performance on projects with many measures.
3. Allows to share resources among different projects: Ex: suppose you have project A, B and C. for each one you have a dedicated chrome best agent running (mA, mB, mC). Project X will always run in machine mX. With the hub, these 3 machines can be shared, and jobs from A, B and C can run in the hub.

## Getting Started

### Starting the hub

To start the hub server, simply run in your command line:

```bash
node bin/best-agent-hub.js
```

This command will start the hub server using the following configuration:

-   Running port: `6000`. It can be overridden by setting `env.PORT` to the desired port.
-   Tokens secret: `secret`. It's recommended to override it by setting `env.TOKEN_SECRET` to the desired secret used authenticate clients.

### Configuring hub in startup.

You can configure a preset of agents when the hub starts by setting `env.CONFIG` to a json string representing the config for the hub.

The configuration of the hub is an array of hubs agents. Each agent represents a remote best agent like:

```javascript
const config = {
    agents: [
        {
            spec: {
                browser: 'chrome', // Browser name
                version: '76', // Browser version (major)
            },
            host: 'http://localhost:5000', // Required. Url used to connect to the agent.
            options: { path: '/best' }, // Connection
            remoteRunner: '@best/runner-headless', // Required. The runner which the agent will use when running the job.
            remoteRunnerConfig: {}, // Required (may be an empty object). The Runner config for the remote runner in the agent.
        },
        {
            spec: {
                browser: 'ie',
                version: '11',
            },
            host: 'http://127.0.0.1:5002',
            options: { path: '/best' },
            remoteRunner: '@best/runner-webdriver',
            remoteRunnerConfig: {
                webdriverOptions: {
                    desiredCapabilities: {
                        platform: 'WINDOWS',
                        browserName: 'internet explorer',
                        version: '11',
                        ignoreZoomSetting: true,
                        initialBrowserUrl: 'about:blank',
                        nativeEvents: false,
                    },
                },
            },
        },
    ],
};

// set env.CONFIG=JSON.stringify(config);
```

**Note:** All agents with the same spec, should have the same configuration and hardware characteristics, this must be ensured given that a job to be run with these specs, can run in any of the agents, and they should return same results.

## How to use the hub your project

Add a new runner config section on your best.config:

```javascript
// Replace this token with a generated one for the used TOKEN_SECRET when starting the hub server
const hubAuthenticationToken =
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzY29wZSI6ImNsaWVudCIsImlhdCI6MTU2MTYwNzI1OCwiZXhwIjoxNTY0MTk5MjU4fQ.BER-PIIlsf6NWNBctWrmS1YWB4QkI2aYiNp0BE6aASU';

module.exports = {
    projectName: 'simple-benchmark-chrome',
    benchmarkOnClient: true,
    runnerConfig: [
        {
            runner: '@best/runner-headless',
            alias: 'default',
        },
        // Configs to use the hub
        {
            runner: '@best/runner-hub',
            alias: 'hub-chrome',
            config: {
                host: 'http://localhost:6000',
                options: {
                    path: '/hub',
                    query: {
                        token: hubAuthenticationToken,
                    },
                },
                spec: {
                    browser: 'chrome',
                    version: '76',
                },
            },
        },
        {
            runner: '@best/runner-hub',
            alias: 'hub-ie11',
            config: {
                host: 'http://localhost:6000',
                options: {
                    path: '/hub',
                    query: {
                        token: hubAuthenticationToken,
                    },
                },
                spec: {
                    browser: 'ie',
                    version: '11',
                },
            },
        },
    ],
};
```

Then you can run your measures in your project:

```bash
# Measures in chrome:
best --runner hub-chrome

# Measures in ie11:
best --runner hub-ie11
```

### Adding agents to the hub once started

Once the hub has already started you can add agents by doing a post request to `/api/v1/agents`. Example:

```bash
curl -X POST \
  http://localhost:6000/api/v1/agents \
  -H 'authorization: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzY29wZSI6ImFnZW50IiwiaWF0IjoxNTYxNjE0MjM3LCJleHAiOjE1NzcxNjYyMzd9.IjdCBSPPIGSgpYHN8Pxhusaiv48T1t6rmxR2xzdp17M' \
  -H 'cache-control: no-cache' \
  -H 'content-type: application/json' \
  -d '{
	"host":"http://localhost:5000",
	"options":{"path":"/best"},
	"remoteRunner":"@best/runner-headless",
	"remoteRunnerConfig":{},
	"spec": {
		"browser": "chrome",
		"version": "76"
	}
}'
```
