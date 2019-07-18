---
title: Continuous Integration
---

# Continuous Integration
The best way to use Best is to integrate it into your CI workflow. We encourage you run your CI for all commits into master and on Pull Requests, by doing this you can ensure that you are measuring your code's performance whenever there are changes.

## Pull Requests
When a new PR is created, we recommend using Best in the following ways by activating it twice:

1. `best` Run your benchmarks on your current code to measure their performance
2. `best --compareStats` Run Best in comparison mode with the current code compared against the branch you are trying to merge into.

By running Best a second time in comparison mode we can generate a comparison table which we can then show on the Pull Request using the [GitHub Integration](/guide/github-integration). 

When you run Best in comparison mode we are ensuring that we have as close to the same environment as possible so that we can reduce extraneous variables that may effect the results of our performance tests.

## Commits to Master
When you run your CI after a new commit to master we recommend running Best again and ensuring that the results are stored so that you can see the performance on [the Frontend](/guide/frontend). This will allow you to see a graph of your code's performance over time with each change into master.

There is no need to run Best in comparison mode since you do not have anything to compare your new code in master against.

## Example in CircleCI
If you want to see a full example you can look at Best's own CircleCI [`config.yml`](https://github.com/salesforce/best/blob/master/.circleci/config.yml). Take a look inside the `perf_and_compare` job to see how we are running Best. In short we have the following commands inside the configuration file.

```
- run:
    name: Run BEST Benchmarks
    command: yarn perf
- run:
    name: Compare BEST Benchmarks
    command: yarn perf --compareStats ${BASE_COMMIT} ${TARGET_COMMIT} --gitIntegration
```

Here we have a Yarn command called `perf` which is essentially an alias to the Best CLI. You can see that first we run Best to measure the performance of our new code from the Pull Request.

Then, we run `best --compareStats` and pass a base commit which is the newest commit from master, and a target commit which is the newest commit from our PR. Lastly we pass the `--gitIntegration` flag so that Best will update the PR on GitHub.

::: tip
We **highly** encourage you to use a remote runner when running your benchmarks because otherwise there is no way to guarentee reproducible results. Please check out the guide on [running remotely](/guide/running-remotely) to see how to do this.
:::

## External Storage
The last thing to keep in mind when running Best in your CI workflow is that we encourage you to use an external storage provider to store the artifacts that Best generates. This means you do not have to re-build your benchmarks every time we run the comparison. We currently support storing the artifacts on AWS.

To enable this pass the `--externalStorage`:
```
best --compareStats ${BASE_COMMIT} ${TARGET_COMMIT} --externalStorage=@best/store-aws
```

You must also set the `AWS_BUCKET_NAME` environment variable so that Best knows where to look for your artifacts.

::: todo
We need to make a note of what type of permissions the bucket should have so that Best can read & write the artifacts.
:::

::: important
This is necessary if you want to use a [remote runner](/guide/running-remotely) to run your benchmarks.
:::