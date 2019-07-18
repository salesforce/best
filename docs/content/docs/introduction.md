---
title: Understanding Best
---

# Understanding Best
Best came out of the need to have a tool that can consistently benchmark Javascript in the same way we can unit test our code. In persuit of this goal, Best follows an opinionated model of performance benchmarking. Read on to learn about how Best will help you ensure you have performant code, and most importantly, that it stays that way over time.

## The "Best" Manifesto
Once you have written your performance benchmarks, you pass them off to Best to process, run, and then analyze. This guide describes how that all happens.

### Best Builder
Before we can run your benchmarks, we have compile them into an artifact that can be re-run at anytime and correctly reflects the state of your code. We do this by using Rollup to generate a bundle that contains your benchmarks, the code you are testing, and the Best Runtime.

We inject the runtime at build time and this is what allows us to actually measure your code's performance in the browser.

::: todo
Add diagram showing: code + benchmarks + runtime = artifact bundle
:::

These artifacts are stored over time so that we can always go back and re-run them on whatever machines we want to capture an accurate representation of your code's performance over time.

### Running Locally
Now that we have generated consistent artifacts, it is time to run them and measure your code's performance. While you are developing new features on your local machine, we encourage you to occasionally run Best locally to get a rough measurement of how your code's performance characteristics may have changed.

This is ideal for local development, however the goal of Best is to create reproducible measurements of your code's performance, and that is where Best Agents come in.

### Best Agents
Agents are the key aspect of Best which allow us to create reproducible results. By running Best Agents on dedicated hardware, we can ensure that how code is running in a consistent environment with extraneous variables that might effect the code's performance.

Best Agents are quite simple in the sense that they essentially run a benchmark and then tell you how long it took. This allows us to have leave the building and analyizing to the client (either your local machine or the CI).

A single Best Agent will have one environment that it can run code in, perhaps Chrome 74, and then you can have another agent running a different version of Chrome. This allows us to run our benchmarks in various environments while still maintaing the reproducibility of our results.

### Best Hubs
Agents work great for running your code in a stable, isolated, and reproducible environment. However, once you begin to have a larger team or want to use Best across your organization, you need some sort of orchestration tool. This is where Best Hub comes in.

Best Hub allows any client to connect to a single endpoint, and then the hub handles connecting to agents to actually run your benchmarks. This means that you can have multiple agents running the same environment for parallelization or agents running different specs to test in separate environments.

::: tip
The great thing about Best Hub is that once you have a hub running for your organization, each team does not have to worry about its own benchmarking infastrcture. They can all connect to the same hub!
:::

Once you have Best Hub running, you get to take full advantage of everything Best has to offer. You can read more about this in [Running Remotely](/guide/running-remotely).

![The "Best" Hub Model](/assets/images/best_hub_model.svg)

### CI Integration
Continuous integration is the best place to invoke Best. By integrating performance benchmarking next to your unit tests, you not only can ensure your code is working correctly, but you can be sure that your new changes are not negatively effecting performance.

Additionally, since CI runs on all of your commits you can create consistent snapshots of your code's performance overtime.