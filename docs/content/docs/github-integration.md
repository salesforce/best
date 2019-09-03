---
title: GitHub Integration
---

# GitHub Integration
Best comes with GitHub Integration for rapid adoption into your existing development flow. It uses Github's [Checks](https://developer.github.com/v3/checks/) to report when benchmark results differ across commits.

## Installation
Best relies on a Github App to interact with your repositories. Follow [Github's guide to create a GitHub App](https://developer.github.com/apps/building-github-apps/creating-a-github-app/). We recommend naming the App `Best - [organization name]`.

The Github App requires the following permissions:
- **Checks**: Read/Write
- **Issues**: Read/Write
- **Pull Requests**: Read/Write

Set the following environment variables so Best may authenticate and interact with your Github App. It is recommended to set these environment variables in your CI.
```
GIT_APP_ID=0000
GIT_APP_CERT_PATH=/path/to/private-key.pem
GIT_APP_CERT_BASE64=base64_encoded_version_of_private_key
```
Set either `GIT_APP_CERT_PATH` or `GIT_APP_CERT_BASE64`.

::: tip
If you want to enable GitHub integration for the frontend then your must set these environment variables on your frontend instance as well.
:::

To enable comments on pull requests from your CI workflow set the environment variable `PULL_REQUEST` with the URL of the pull request.

## Usage
Best will activate the GitHub integration when you pass the `--gitIntegration` flag. This tells Best to create a GitHub Check and then possibly comment if there is a significant performance change.

::: note
You must specify the `--compareStats` flag to use `--gitIntegration` because Best reports meaningful difference _across commits_.
:::

## Configuration
By default, Best comments on pull request when the average performance across your benchmarks changes by more than `5%`. You can change this threshold by adding the following to your `best.config.js`:
```js
{
    commentThreshold: 5
}
```
