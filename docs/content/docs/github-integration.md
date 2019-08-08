---
title: GitHub Integration
---

# GitHub Integration
Best comes built-in with a GitHub Integration so you can insert Best into your Pull Request workflow. The integration provides the ability to use checks to ensure the performance benchmarks properly, as well as the ability to comment when performance improves or regresses.

## Installation
In order to setup the integration you will need to create your own GitHub App that Best will use to interact with your repositories. GitHub has great documentation on [Creating a GitHub App](https://developer.github.com/apps/building-github-apps/creating-a-github-app/) that you should read in order to create your app. We encourage naming it something like `Best - Organization Name`.

You will need to grant your app the following permissions:
- **Checks**: Read/Write
- **Issues**: Read/Write
- **Pull Requests**: Read/Write

These are the permissions that Best currently needs, however in the future we may add functionality which will require more permissions.

Once you have successfully created your GitHub App, given it the proper permissions, and enabled it on the repo you would like to use with Best, you will need to set the following environment variables for Best.

Best needs the App ID and a private key in order to authenticate itself. Setting the following `env` variables will allow Best to see these credentials.
```
GIT_APP_ID=0000
GIT_APP_CERT_PATH=/path/to/private-key.pem
GIT_APP_CERT_BASE64=base64_encoded_version_of_private_key
```
You can set either `GIT_APP_CERT_PATH` or `GIT_APP_CERT_BASE64` for Best to get access to the certificate.

We encourage you to set these environment variables in your CI so that when you run Best through your CI the GitHub integration will run automatically.

::: tip
If you want to enable the GitHub integration for the frontend, you will need to set these environment variables on your frontend instance as well.
:::

Lastly, if you want to enable comments on Pull Requests from your CI workflow, you will need to set the environment variable `PULL_REQUEST` with the URL of the Pull Request.

## Usage
Best will activate the GitHub integration when you pass the `--gitIntegration` flag in the command line. This will tell Best to create a GitHub Check and then possibly comment if there is a significant performance change.

::: note
The `--gitIntegration` command only works together with the `--compareStats` command, as the GitHub integration is meant for when you are comparing two different versions of code against the same benchmarks.
:::

## Configuration
By default, Best will leave a comment on the Pull Request when the average performance across your benchmarks changes by more than `5%`, however you are welcome to configure that number by adding the following in your `best.config.js`:
```js
{
    commentThreshold: 5
}
```
