# Configuring Best

Best is highly configurable through command-line arguments,
the Best configuration file, and environment variables.

* [Command Line Arguments](#command-line-arguments)
* [Best Configuration File](#best-configuration-file)
* [Environment Variables](#environment-variables)

## Command Line Arguments

Command-line arguments override the same option specified
in the configuration file.

### `--help, -h`

`boolean` Shows the help page.

### `--config, -c`

`string` Path to a Best config file specifying how to find and execute
benchmarks. If no `rootDir` is set in the config, the current directory
is assumed to be the `rootDir` for the project. Can also be a JSON
encoded value which Best uses as the configuration.

### `--projects`

`array` List of projects to run. The arguments must be paths to Best
config files or a local repo with Best configured.

### `--iterations`

`number` Defines the number of iterations to run for all the benchmarks.

### `--clearCache`

`boolean` Clears the configured cache directory and then exits.

### `--showConfig`

`boolean` Shows the config before running Best.

### `--clearResults`

`boolean` Clears all generated benchmarks from the `benchmarkOutput` directory.

### `--disableInteractive`

`boolean` Disables interactivity on TTI.

### `--runInBatch`

`boolean` Runs jobs in batches.

### `--showConfigs`

`boolean` Displays calculated `globalConfig` and project configs.

### `--compareStats`

`array` Compares the benchmarks of two commits against each other.
If `--externalStorage` is provided, Best uses that as its source,
otherwise it searches for results on the file system.

### `--gitIntegration`

`boolean` GitHub integration, causes Best to post results of the
benchmark or comparison.

### `--generateHTML`

`boolean` Generates a static HTML version of the benchmark or comparison
results. You must also include `@best/frontend` as a dependency.

### `--dbAdapter`

`string` Overrides the database adapter. By default, Best comes with
`sql/sqlite` and `sql/postgres`. If this flag is provided, you must
also provide `--dbURI`. This flag overrides any options provided in
`apiDatabase` in the config file.

### `--dbURI`

`string` Specifies a connection URI or path to pass to the database
adapter.

### `--dbToken`

`string` Some database providers (e.g. rest/frontend) communicate over
HTTP(S) and this token is used for authorization.

### `--runner`

`string` Selects the runner to execute the benchmarks. Requires the
`runnerConfig` option in the Best config file. By default, Best uses
`@best/runner-headless`.

### `--runnerConfig`

`string` JSON representation of the configuration for the runner.

### `--useHttp`

`boolean` Runs benchmarks against a temporary HTTP server (instead
of using the `file:` protocol).

## Best Configuration File

The Best configuration file (`best.config.js`) supports the following
options.

### `projectName` (required)

`string` Specifies the name of the benchmarking project.

### `mainBranch`

`string` Specifies the name of the main branch, defaults to `main`.

When best is not run on the main branch the snapshot is marked as temporary.

### `metrics`

`array` The set of metrics to capture. Currently supported options
are `script`, `aggregate`, `paint`, and `layout`. By default, Best
captures all metrics. For more information, see [Expressive
Metrics](../introduction/#expressive-metrics).

### `apiDatabase`

`object` Specifies the hosted API database to store results.
The configuration must specify an adapter and a connection URI.
Best supports the `sql/sqlite` and `sql/postgres` adapters.

```js
{
    apiDatabase: {
        adapter: 'sql/postgres',
        uri: `postgresql://localhost`
    }
}
```

### `assets`

`array` The list of static asset sources to configure.

If `alias` is not specified the assets are served from `/`.

When `alias` is specified the assets are served from that path,
for example `/assets`.

```js
{
    assets: [
        {
            path: './public/',
        },
        {
            alias: '/assets',
            path: '/path/to/node_modules/my-static-assets/dist/',
        },
    ];
}
```

### `commentThreshold`

`number` For use with the [GitHub Integration](../github-integration/),
this specifies the threshold for when Best posts a comment about
performance on the pull request.

### `runInBatch`

`boolean` When running on the Hub, specifies to run multiple benchmarks
at the same time.

### `projects`

`array` List of locations where each project's `best.config.js` lives.

### `plugins`

`array` Specifies a list of Rollup plugins to use when building the
benchmark artifacts. These must be in the following format.

```js
{
    plugins: [
        ['@lwc/rollup-plugin', { rootDir: '<rootDir>/src/' }],
        ['@rollup/plugin-replace', { 'process.env.NODE_ENV': JSON.stringify('production') }],
    ];
}
```

### `runner`

`string` Selects the runner for the benchmarks. Use the `alias` value
from the `runners` configuration value.

### `runners`

`array` The list of runners to run benchmarks.

For the headless runner, [Puppeteer launch
options](https://github.com/puppeteer/puppeteer/blob/main/docs/api.md#puppeteerlaunchoptions)
can be provided using the `launchOptions` property in the runner config.

```js
{
    runners: [
        {
            runner: '@best/runner-headless',
            alias: 'default',
            config: {
                launchOptions: {
                    headless: false,
                    devtools: true,
                },
            },
        },
        {
            runner: '@best/runner-remote',
            alias: 'remote-agent',
            config: {
                host: 'http://localhost:5000',
                options: { path: '/best' },
                remoteRunner: '@best/runner-headless',
            },
        },
    ];
}
```

### `benchmarkMaxDuration`

`number` The maximum amount of time in milliseconds that a benchmark
can run. Specify this number instead of the number of iterations.

### `benchmarkMinIterations`

`number` The minimum number of iterations to run a benchmark.

### `benchmarkOnClient`

`boolean` Specify `false` to refresh the browser after each iteration
of the benchmark.

### `benchmarkIterations`

`number` Sets the number of times to run a benchmark.

## Environment Variables

### `HTTP_PROXY`

`string` Specifies the HTTPS proxy to use when communicating to the
Hub or Agent. Format is `https://0.0.0.0:0000`.

### `HUB_CONFIG`

`string` JSON string specifying the config an Agent must use to connect
to a Hub. Read more in [Configuring Your Agents](../running-remotely/#configuring-your-agents).

### `TOKEN_SECRET`

`string` Contains the secret used by the Hub to authenticate clients
and Agents.

### `SSL_PFX_FILE`

`string` Path to the `.pfx` file to enable SSL on Agent or Hub. Use
together with `SSL_PRX_PASSPHRASE`.

### `SSL_PRX_PASSPHRASE`

`string` The password to access the `.pfx` file.

### `GIT_APP_ID`

`string` Application Id of the GitHub application used when the
`--gitIntegration` flag is enabled. Read more in the [GitHub
Integration](../github-integration/#installation) guide. Use together
with one of the following two items.

### `GIT_APP_CERT_PATH`

`string` Path to the private key for the GitHub application.

### `GIT_APP_CERT_BASE64`

`string` Base64 encoded version of the private key from the GitHub
application.

### `PULL_REQUEST`

`string` URL of the pull request related to the CI workflow. Causes
Best to comment on the pull request when benchmark comparison exceeds
the threshold.

### `BASE_COMMIT`

`string` The baseline commit to be used with `--compareStats`. Set
a value for `TARGET_COMMIT` as well.

### `TARGET_COMMIT`

`string` The target commit to be used with `--compareStats`. Set
a value for `BASE_COMMIT` as well.
