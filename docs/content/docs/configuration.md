---
title: Configuration
---

# Configuring Best
Below you will find a detailed reference of all the command line arguments, as well as the options available to configure in your `best.config.js`.

## Command Line Argumemnts
Here is a list of all of the arguments you can supply when running Best from the command line. If you pass one of these arguments it will override the same option in your config file.

#### `--help, -h`
`boolean` Shows the help page.

#### `--config, -c`
`string` The path to a best config file specifying how to find and execute benchmark runs. If no rootDir is set in the config, the current directory is assumed to be the rootDir for the project. This can also be a JSON encoded value which Best will use as configuration.

#### `--projects`
`array` A list of projects to run. The arguments must be paths to best config files or a local repo with best configured.

#### `--iterations`
`number` Define the number of iterations to run for all the benchmarks.

#### `--clearCache`
`boolean` Clears the configured Jest cache directory and then exits. Default directory can be found by calling jest.

#### `--showConfig`
`boolean` Show the config before running Best.

#### `--clearResults`
`boolean` Clear all generated benchmarks from the `benchmarkOutput` folder.

#### `--disableInteractive`
`boolean` Disabled interactivity on TTI.

#### `--runInBatch`
`boolean` Run jobs in batches.

#### `--showConfigs`
`boolean` Displays calculated globalConfig and project configs.

#### `--externalStorage`
`string` This option allows to save the results in an arbitrary storage system. Pass the external storage adapter that you would like to use.

#### `--compareStats`
`array` Compares the benchmarks of two commits against each other. If --externalStorage is provided it will use that source, otherwise it will try to find the results on the file system.

#### `--gitIntegration`
`boolean` Integrates with GitHub, posting the results of the benchmark or comparison.

#### `--generateHTML`
`boolean` Generate a static HTML version of the results of the benchmrak or comparison.

#### `--dbAdapter`
`string` Override which database adapter is used. By default Best comes with `sql/sqlite` and `sql/postgres`. If you pass this option, then `--dbURI` is also required. This will override any options provided in `apiDatabase` in your config file.

#### `--dbURI`
`string` Provide a connection URI or path to be passed to the database adapter.

#### `--runner`
`string` Select the runner to execute the benchmarks. Make sure you have defined `runnerConfig` options in your Best config file. By default it will use `@best/runner-headless`.

#### `--runnerConfig`
`string` JSON representation of the configuration to use for the give runner.

#### `--useHttp`
`boolean` Runs benchmarks against a temporary HTTP server (instead of using the "file:" protocol).

## Best Configuration
Below are all of the support options that you can customize in your `best.config.js`:

#### `projectName` (required)
`string` Specify the name of your benchmarking project here.

#### `gitIntegration`
`boolean` Integrates with GitHub, posting the results of the benchmark or comparison.

#### `externalStorage`
` string` This option allows to save the results in an arbitrary storage system. Pass the external storage adapter that you would like to use. Currently Best supports AWS with the `@best/store-aws` adapter.

#### `apiDatabase`
`object` This option must be supplied in order to store your results in a database for use with the frontend. The configuration must specify an adapter and connection uri. Best currently supports either `sql/sqlite` or `sql/postgres` databases.
```js
{
    apiDatabase: {
        adapter: 'sql/postgres',
        uri: `postgresql://localhost`
    }
}
```

#### `commentThreshold`
`number` For use with the [GitHub Integration](/guide/github-integration), this specifies the threshold for whether or not Best should leave a comment about performance on the Pull Request.

#### `runInBatch`
` boolean` When running on the hub, you can specify this option to your multiple of your benchmarks at the same time.

#### `projects`
`array` A list of locations where each project's `best.config.js` lives.

#### `plugins`
`array` You can pass a list of Rollup plugins that you would like to be used when building your benchmark artifacts. These should be in the following format.
```js
{
    plugins: [
        ['@lwc/rollup-plugin', { rootDir: '<rootDir>/src/' }],
        ['rollup-plugin-replace', { 'process.env.NODE_ENV': JSON.stringify('production') }],   
    ]
}
```

#### `runner`
`string` Select which runner your benchmark should use to run. The value of the `alias` field below is what you should specify here.

#### `runners`
`array` A list of the possible runners you might want to run your benchmarks on.
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
`number` The maximum amount of time in milliseconds that your benchmark should run for. This can be given instead of a set number of iterations.

#### `benchmarkMinIterations`
`number` The minimum number of iterations that your benchmark will run.

#### `benchmarkOnClient`
`boolean` description...

#### `benchmarkIterations`
`number` Explicitly set the number of times your benchmark should be run.