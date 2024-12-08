# GitHub Integration

Best comes with GitHub Integration for rapid adoption into your
existing development flow. It uses GitHub's
[Checks](https://developer.github.com/v3/checks/) to report when
benchmark results differ across commits.

## Installation

Best relies on a GitHub app to interact with your repositories.
Follow [GitHub's guide to create a GitHub App](https://developer.github.com/apps/building-github-apps/creating-a-github-app/).
We recommend naming the App `Best - [organization name]`.

The GitHub App requires these permissions:

- **Checks**: Read/Write
- **Issues**: Read/Write
- **Pull Requests**: Read/Write

Set these environment variables so Best can authenticate and interact
with your GitHub App. We recommended setting these environment variables
in your CI.

```sh
GIT_APP_ID=0000
GIT_APP_CERT_PATH=/path/to/private-key.pem
GIT_APP_CERT_BASE64=base64_encoded_version_of_private_key
```

Set either `GIT_APP_CERT_PATH` or `GIT_APP_CERT_BASE64`.

?> To enable GitHub integration for the front end, set these environment
variables on your front end instance as well.

To enable comments on pull requests from your CI workflow, set the
environment variable `PULL_REQUEST` with the URL of the pull request.

## Usage

Best activates the GitHub integration when you pass the `--gitIntegration`
flag. This flag tells Best to create a GitHub Check and comment if there
is a significant performance change.

?> You must specify the `--compareStats` flag to use `--gitIntegration`
because Best reports meaningful differences _across commits_.

## Configuration

By default, Best comments on a pull request when the average performance
across your benchmarks changes by more than `5%`. You can change this
threshold by adding the following to your `best.config.js`.

```js
{
    commentThreshold: 5;
}
```
