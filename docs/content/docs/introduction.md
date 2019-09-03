---
title: Understanding Best
---

# Understanding Best
Best came out of our need to consistently benchmark Javascript the same way we unit test our code. In pursuit of this goal, Best follows an opinionated model of performance benchmarking. Read on to learn how Best can help you create performant code and, most importantly, that it stays that way over time.

::: note
The name of the project *Best* was inspired by *Jest* - changing the *"J"* to a *"B"* for *"benchmarks."* The idea was that running benchmarks and doing perf testing should be as easy as unit testing.
:::

## The Best Manifesto
_Performance benchmarking should be as easy to write, run and trust as unit testing._

## How Best Works
Once you have written your performance benchmarks, you pass them off to Best to process, run, and analyze. This guide describes how that all happens.

### Best Builder
Before you can run your benchmarks, you must compile them into an artifact that Best can re-run at any time. You do this by using <a href="https://rollupjs.org/">Rollup</a> to generate a bundle that contains your benchmarks, the code you are testing, and the Best runtime.

![Builder](/assets/images/builder.svg)

By including the Best runtime in the generated artifact you can run (and re-run) a performance benchmark at any time, in any environment (including your local browser), for any version of your code! If you want to compare performance on your local machine then just run them locally. Or if your dedicated hardware changes, you can re-run all the tests to recreate historical performance profiles in your new environment.

### Running Locally
While you are making changes we recommend you run Best locally to measure how your code's performance characteristics have changed.

This works great for local development. But the goal of Best is to create reproducible measurements of your code's performance and that is where Best Agents come in.

### Best Agents
Agents allow Best to create reproducible results. Agents should run in a consistent environment on dedicated hardware to ensure the code and performance benchmark produce consistent results.

Best Agents are simple: they run a benchmark and report how long it took. The client, like your machine or a CI, is responsible for compiling and analyzing the results.

Each Best Agent is responsible for running the test in a single environment. For example, first Agent runs Chrome 74, the second Agent runs Chrome 76, and the third Agent runs Edge.

### Best Hubs
As you increase the number of Agents to support a growing team or organization, coordinating and efficiently using all Agents becomes challenging. Best Hubs provide a single entry point for a client to run performance benchmarks. The Best Hub orchestrates an unlimited number of Agents to run benchmarks. It runs tests in parallel across Agents, of the same and different environment, to deliver results as quickly as possible.

::: tip
Multiple teams and users may use a single Best Hub. This avoids teams running their own performance infrastructure. Scale the Hub up by adding as many Agents as you need.
:::

Once you have Best Hub running, you get to take full advantage of everything Best has to offer. Read more about this in [Running Remotely](/guide/running-remotely).

![The "Best" Hub Model](/assets/images/best_hub_model.svg)

### CI Integration
Continuous integration is the best place to invoke Best. By integrating performance benchmarking next to your unit tests, you ensure your code is functioning correctly and performing well.

Additionally, since CI runs on all of your commits you can create consistent snapshots of your code's performance overtime.

### Expressive Metrics
Best helps you understand your code's performance with its many metrics.

- `aggregate` The total time your benchmark took to run. If you look at one metric it should be this one.
- `script` The time it took to evaluate your benchmark code. This is useful to confirm your benchmark code is running as quickly as you expect.
- `paint` If your benchmark involves the DOM, Best measures how much time the browser spends on painting. This is useful to make your UI codepaths more efficient.
- `layout` If your benchmark involves the DOM, Best measures how much time the browser spends on layouts. This gives you a picture of how complex of DOM structure you are using.

**Note:** The `paint` and `layout` metrics are only available when using `runner-headless` because Best gets these directly from Chrome Dev Tools tracing.
