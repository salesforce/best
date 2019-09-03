---
title: Running Remotely
---

# Running Remotely
Now you that you have written some benchmarks and setup your `best.config.js`, it's time to setup Agents to remotely run your tests in environments that produce consistent results.

## Agents
Agents run performance benchmarks. They should be deployed to dedicated hardware with stable environments so the results are consistent.

::: important
While dedicated hardware can be expensive or hard to manage, it is **strongly** recommend to run Best Agents on dedicated hardware. This means that there will be no other processes on the machine influencing your benchmarks. This is key to a reproducible and reliable measurement.
:::

### Provisioning an Agent
To provision a Best Agent your server needs [Puppeteer](https://github.com/GoogleChrome/puppeteer) so Best can run your benchmarks using the headless runner inside Google Chrome.

The easiest way to get setup an Agent is by clicking the button below. It creates a Heroku app with everything you need.

**Note:** If you want to use a Best Hub, provision the Hub first and then come back and press the button to configure your Agent to work with your Hub.

[![Deploy Best Agent](https://www.herokucdn.com/deploy/button.svg)](https://heroku.com/deploy?template=https://github.com/salesforce/best-heroku-deploy/tree/agent)

If you need more control over deployment follow [this template](https://github.com/salesforce/best-heroku-deploy/tree/agent). Only minimal tweaking is required to run this in any environment.

If you need complete control install the `@best/agent` package. You will probably need the `@best/runner-headless` package to use the headless Chrome runner. Use the above template for inspiration on setting up your Agent.

Once you have these installed, run the following command to start the Agent:
```sh
yarn best-agent
```

### Configuring Best to Run Remotely
The last step to run your benchmarks remotely is to add the runner to your `best.config.js`:
```js
module.exports = {
    projectName: 'agent-running',
    runner: 'remote-agent',
    runners: [
        {
            runner: "@best/runner-remote",
            alias: "remote-agent",
            config: {
                host: "https://agent-url.herokuapp.com",
                remoteRunner: "@best/runner-headless"
            },
        },
    ]
}
```

## Hubs
Use Best Hub if you have a lot of jobs that you want to run or would like to run your benchmarks on multiple machines. Best Hub provides a single entry point for your entire organization to access Best Agents.

### Provisioning a Hub
Provisioning a Best Hub is even easier than setting up an Agent. The easiest way to get a Hub setup is clicking the button below. It creates a Heroku app with everything you need.

[![Deploy Best Hub](https://www.herokucdn.com/deploy/button.svg)](https://heroku.com/deploy?template=https://github.com/salesforce/best-heroku-deploy/tree/hub)

If you need more control over deployment follow [this template](https://github.com/salesforce/best-heroku-deploy/tree/hub). This is a minimal template so you must configure it to suit your target environment.

If you need complete control over the Hub install the `@best/agent-hub` package. You will probably need the `@best/runner-headless` package. Use the above template for inspiration on setting up your Hub.

Once you have installed these packages, run the following command to start the Hub:
```sh
yarn best-agent-hub
```

If you used the Heroku button above then a `TOKEN_SECRET` is automatically set as an environment variable, otherwise you must set it yourself. This token is used by your Agents and clients for authentication.

### Configuring Your Agents
Now that you have your Hub setup you can configure your Agents.

The easiest way is to click the button in the Agents section to deploy to Heroku. It will guide you through provisioning an Agent with the necessary configuration to interact with your Hub.

Alternatively you can manually configure your Agents to talk to your Hub. Set an environment variable called `HUB_CONFIG` to a JSON string with the following information.

```js
{
    hub: {
        host: "https://hub-url.herokuapp.com",
        authToken: process.env.HUB_TOKEN,
        pingTimeout: 180000, // Optional: Default is 180000ms (3 minutes).
    },
    agentConfig: {
         spec: { // Only benchmarks with this spec can run in this agent.
             browser: "chrome",
             version: "76"
         },
         host: "https://agent-url.herokuapp.com", // Required.
         options: { path: "/best" }, // Connection Options
         remoteRunner: "@best/runner-headless", // Required.
         remoteRunnerConfig: {}, // Required (may be an empty object).
     }
}
```

The Agent uses this configuration to register with the Hub. Additionally, the `spec` field describes the browser and version that this Agent is running. This is used together with the `spec` option inside the `best.config.js` below.

You should set the environment variable `HUB_TOKEN` to your token which you got from the above steps.

### Configuring Best
Now that you have configured your Hub and Agents you need to tell Best to run your benchmarks on them. Update your `best.config.js` with the following.

```js
module.exports = {
    projectName: 'hub-running',
    runner: 'hub',
    runners: [
        {
            runner: "@best/runner-hub",
            alias: "hub",
            config: {
                host: "https://hub-url.herokuapp.com",
                options: {
                    query: { token: process.env.HUB_TOKEN }
                },
                spec: {
                    browser: "chrome",
                    version: "76"
                }
            }
        }
    ]
}
```

This is similar to configuring Best to run on an Agent except you have added a `spec` configuration option. Like you added information about the browser and version to the Agents, you can tell the Hub which browser and version to run your benchmarks.

You should set the environment variable `HUB_TOKEN` to your token which you got from the above steps.

## Agent & Hub Frontend
Both the Hubs and Agents come with a built-in frontend that allows you to monitor the state of the benchmarks they are running.

View the frontend by visiting the URL of your Hub or Agent agent.

<img class="window-capture" src="/assets/images/agent_frontend.png" alt="Agent Frontend">
