---
title: Running Remotely
---

# Running Remotely
Now you that you have written some benchmarks and setup your `best.config.js`, it's time to setup your remote running environment so that you can have reproducible results with Best.

## Agents
Agents are the core piece of running a benchmark remotely. They are the machines whose sole purpose is to run your code in the same environment every time.

::: important
While dedicated hardware can be expensive or hard to manage, we **strongly** recommend running Best Agents on dedicated hardware. This means that there will be no other processes that you do not have control over running on your machine while you are trying to run your benchmarks. This is the key to a reproducible measurement.
:::

### Provisioning an Agent
In order to provision a Best Agent your server will need access to [Puppeteer](https://github.com/GoogleChrome/puppeteer) so that we can run your benchmarks using the headless runner inside Google Chrome. The easiest way to get an agent up and running is by clicking the button below which will create a Heroku app with everything you need.

**Note:** If you want to use a hub, please provision your hub first and then come back and press the button to configure your agent to work with your hub.

[![Deploy Best Agent](https://www.herokucdn.com/deploy/button.svg)](https://heroku.com/deploy?template=https://github.com/salesforce/best-heroku-deploy/tree/agent)

Alternatively, if you want more control over deployment, we recommend following [this template](https://github.com/salesforce/best-heroku-deploy/tree/agent) which contains everything you will need. Only a little tweaking should be required to get this to work with whatever cloud hosting you need.

Lastly, if you want complete control, you can install the `@best/agent` package. You will also probably need the `@best/runner-headless` package so you can use the headless Chrome runner. We still recommend looking at the above template to see an example of how to setup your agent.

Once you have these installed, you can run the following command to start an agent:
```sh
yarn best-agent
```

### Configuring Best to Run Remotely
The last step in running your benchmarks remotely is to add the runner to your `best.config.js`:
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
            }
        },
    ]
}
```

## Hubs
If you have a lot of jobs that you want to run, or would like to run your benchmarks on multiple machines, then Best Hub is perfect you for. Best Hub allows you to create a single point of orchestration for your entire organization to access Best's agents.

### Provisioning a Hub
Provisioning a Best Hub is even easier than setting up an agent. The easiest way to get a hub up and running is by clicking the button below which will create a Heroku app with everything you need.

[![Deploy Best Hub](https://www.herokucdn.com/deploy/button.svg)](https://heroku.com/deploy?template=https://github.com/salesforce/best-heroku-deploy/tree/hub)

Alternatively, if you want more control over deployment, we recommend following [this template](https://github.com/salesforce/best-heroku-deploy/tree/hub) which contains everything you will need to get a hub up and running. This template contains a bare-bones template so you can deploy Best to whatever cloud hosting provider you would like.

Lastly, if you want full control over your hub, you can install the `@best/agent-hub` package. You will also probably need the `@best/runner-headless` package again. We still advise looking at the above template to see an example of how to setup your hub.

Once you have installed these packages, you can run the following command to start a hub:
```sh
yarn best-agent-hub
```

If you used the Heroku button above, then a `TOKEN_SECRET` will automatically be set as a environment variable, otherwise you will need to set it yourself. This token will be used by your agents and your clients for authentication.

### Configuring Your Agents
Now that you have your hub setup, you can configure your agents.

The easiest way to do this is to click the button in the agents section that is for deploying a hub's agent to Heroku. This will guide you through provisioning an agent with the proper configuration needed to interact with the hub.

Alternatively, you can configure your agents manually to talk to your hub. To do this you will need to set an environment variable called `HUB_CONFIG`. This should be set to a JSON string with the following information:

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

The agent will use this configuration to register with the hub. Additionally, the `spec` field describes the browser and version that this agent is running. This is used together with the the `spec` option inside the `best.config.js` below.

You should set the environment variable `HUB_TOKEN` to your token which you got from the above steps.

### Configuring Best
Again, now that we have configured the hub and the agents, we need to tell Best to run your benchmarks on them inside your `best.config.js`:

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

This is very similar to configuring Best to run on an agent, except we have added a `spec` configuration option. Like we added information about the browser and version to the agents, we can now tell the hub which browser and version we would like our benchmarks to run on. This allows us to create separate configurations that will run on different agents all through the same hub.

You should set the environment variable `HUB_TOKEN` to your token which you got from the above steps.

## Agent & Hub Frontend
Both the hubs and the agents come built-in with a frontend that allows you to monitor the state of the jobs they are running. 

You can view the frontend simply by visiting the URL of your agent or hub in your browser of choice.

<img class="window-capture" src="/assets/images/agent_frontend.png" alt="Agent Frontend">
