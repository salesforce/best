---
title: Configuration
---

# Configuring Best
Best is highly configurable through command-line arguments, the Best configuration file, and environment variables.
- [Command Line Arguments](#command-line-argumemnts)
- [Best Configuration File](#best-configuration-file)
- [Environment Variables](#environment-variables)

## Command Line Argumemnts
Command-line arguments override the same option specified in the configuration file.

#### `--help, -h`
`boolean` Shows the help page.

#### `--config, -c`
`string` Path to a Best config file specifying how to find and execute benchmarks. If no `rootDir` is set in the config, the current directory is assumed to be the `rootDir` for the project. Can also be a JSON encoded value which Best uses as the configuration.

#### `--projects`
`array` List of projects to run. The arguments must be paths to Best config files or a local repo with Best configured.

#### `--iterations`
`number` Defines the number of iterations to run for all the benchmarks.

#### `--clearCache`
`boolean` Clears the configured cache directory and then exits.

#### `--showConfig`
`boolean` Shows the config before running Best.

#### `--clearResults`
`boolean` Clears all generated benchmarks from the `benchmarkOutput` directory.

#### `--disableInteractive`
`boolean` Disables interactivity on TTI.

#### `--runInBatch`
`boolean` Runs jobs in batches.

#### `--showConfigs`
`boolean` Displays calculated `globalConfig` and project configs.

#### `--externalStorage`
`string` Enables saving the results in an arbitrary storage system. Provide the external storage adapter to use. Best supports AWS with the `@best/store-aws` adapter.

#### `--compareStats`
`array` Compares the benchmarks of two commits against each other. If `--externalStorage` is provided Best will use that as its source, otherwise it searches for results on the filesystem.

#### `--gitIntegration`
`boolean` Github integration, causes Best to post results of the benchmark or comparison.

#### `--generateHTML`
`boolean` Generates a static HTML version of the benchmark or comparison results. You must also include `@best/frontend` as a dependency.

#### `--dbAdapter`
`string` Overrides the database adapter. By default Best comes with `sql/sqlite` and `sql/postgres`. If this flag is provided then you must also provide `--dbURI`. This will override any options provided in `apiDatabase` in the config file.

#### `--dbURI`
`string` Specifies a connection URI or path to pass to the database adapter.

#### `--runner`
`string` Selects the runner to execute the benchmarks. Requires the `runnerConfig` option in the Best config file. By default Best uses `@best/runner-headless`.

#### `--runnerConfig`
`string` JSON representation of the configuration for the runner.

#### `--useHttp`
`boolean` Runs benchmarks against a temporary HTTP server (instead of using the "file:" protocol).

## Best Configuration File
The Best configuration fiel (default name is `best.config.js`) supports the following options.

#### `projectName` (required)
`string` Specifies the name of the benchmarking project.

#### `externalStorage`
`string` Allows saving the results in an arbitrary storage system. Specify the external storage adapter to use. Currently Best supports AWS with the `@best/store-aws` adapter.

#### `metrics`
`array` The set of metrics to capture. Currently supported options are `script`, `aggregate`, `paint`, `layout`. By default Best captures all metrics. Read more about metrics [here](/guide/introduction#expressive-metrics).

#### `apiDatabase`
`object` Specifies the hosted API database to store results. The configuration must specify an adapter and connection URI. Best supports either `sql/sqlite` or `sql/postgres` adapters.
```js
{
    apiDatabase: {
        adapter: 'sql/postgres',
        uri: `postgresql://localhost`
    }
}
```

#### `commentThreshold`
`number` For use with the [GitHub Integration](/guide/github-integration), this specifies the threshold for when Best posts a comment about performance on the pull request.

#### `runInBatch`
`boolean` When running on the Hub, specifies to run multiple benchmarks at the same time.

#### `projects`
`array` List of locations where each project's `best.config.js` lives.

#### `plugins`
`array` Specifies a list of Rollup plugins to use when building the benchmark artifacts. These must be in the following format.
```js
{
    plugins: [
        ['@lwc/rollup-plugin', { rootDir: '<rootDir>/src/' }],
        ['rollup-plugin-replace', { 'process.env.NODE_ENV': JSON.stringify('production') }],
    ]
}
```

#### `runner`
`string` Selects the runner for the benchmarks. Use the `alias` value from the `runners` configuration value.

#### `runners`
`array` The list of runners to run benchmarks.
```js
{
    runners: [
        {
            runner: "@best/runner-headless",
            alias: "default"
        },
        {
            runner: "@best/runner-remote",
            alias: "remote-agent",
            config: {
                host: "http://localhost:5000",
                options: { path: "/best" },
                remoteRunner: "@best/runner-headless"
            }
        },
    ]
}
```

#### `benchmarkMaxDuration`
`number` The maximum amount of time in milliseconds that a benchmark may run. This can be given instead of the number of iterations.

#### `benchmarkMinIterations`
`number` The minimum number of iterations to run a benchmark.

#### `benchmarkOnClient`
`boolean` False to refresh the browser after each iteration of the benchmark.

#### `benchmarkIterations`
`number` Sets the number of times to run a benchmark.

## Environment Variables

#### `HTTP_PROXY`
`string` Specifies the HTTPS proxy to use when communicating to the Hub or Agent. Format is `https://0.0.0.0:0000`.

#### `HUB_CONFIG`
`string` JSON string specifying the config an Agent must use to connect to a Hub. Read more in [Configuring Your Agents](/guide/running-remotely#configuring-your-agents).

#### `TOKEN_SECRET`
`string` Contains the secret used by the Hub to authenticate clients and Agents.

#### `SSL_PFX_FILE`
`string` Path to the `.pfx` file to enable SSL on Agent or Hub. Should be used together with `SSL_PRX_PASSPHRASE`.

#### `SSL_PRX_PASSPHRASE`
`string` The password to access the `.pfx` file.

#### `GIT_APP_ID
`string` Application Id of the GitHub application used when the `--gitIntegration` flag is enabled. Read more in the [GitHub Integration](/guide/github-integration#installation) guide. This should be used together with one of the following two items.

#### `GIT_APP_CERT_PATH`
`string` Path to the private key for the GitHub application.

#### `GIT_APP_CERT_BASE64`
`string` Base64 encoded version of the private key from the GitHub application.

#### `PULL_REQUEST`
`string` URL of the pull request related to the CI workflow. Causes Best to comment on the pull request when benchmark comparison exceeds the threshold.

#### `BASE_COMMIT`
`string` The baseline commit to be used with `--compareStats`. A value for `TARGET_COMMIT` must be set as well.

#### `TARGET_COMMIT`
`string` The target commit to be used with `--compareStats`. A value for `BASE_COMMIT` must be set as well.

#### `AWS_BUCKET_NAME`
`string` Name of the AWS bucket to use when `--externalStorage=@best/store-aws` is provided.
