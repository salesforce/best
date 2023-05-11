/*
 * Copyright (c) 2019, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: MIT
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/MIT
 */

import { Options } from 'yargs';
import { CliConfig } from '@best/types';

export const check = () => {
    // TODO: Implement checks
    return true;
};

export const usage = 'Usage: $0 [--config=<pathToConfigFile>] [BenchmarkPathPattern]';
export const docs = 'Documentation: https://opensource.salesforce.com/best';

export const options: { [key: string]: Options } = {
    config: {
        alias: 'c',
        description:
            'The path to a best config file specifying how to find ' +
            'and execute benchmark runs. If no rootDir is set in the config, the current ' +
            'directory is assumed to be the rootDir for the project. This can also ' +
            'be a JSON encoded value which Best will use as configuration.',
        type: 'string',
    },
    projects: {
        description:
            'A list of projects to run. ' +
            'The arguments must be paths to best config files or a local repo with best configured',
        type: 'array',
    },
    iterations: {
        description: 'Define the number of iterations to run for all the benchmarks',
        type: 'number',
    },
    clearCache: {
        default: undefined,
        description:
            'Clears the configured Best cache directory and then exits. ' +
            'Default directory can be found by calling best --showConfig',
        type: 'boolean',
    },
    clearResults: {
        default: undefined,
        description: 'Clear all generated benchmarks from the `benchmarkOutput` folder',
        type: 'boolean',
    },
    disableInteractive: {
        default: undefined,
        description: 'Disabled interactivity on TTI',
        type: 'boolean',
    },
    runInBatch: {
        default: undefined,
        description: 'Run jobs in batches',
        type: 'boolean',
    },
    showConfigs: {
        default: undefined,
        description: 'Displays calculated globalConfig and project configs',
        type: 'boolean',
    },
    runInBand: {
        default: undefined,
        description: 'Run in the main thread in one core (no paralellism)',
        type: 'boolean',
    },
    externalStorage: {
        default: undefined,
        description:
            'This option allows to save the results in an arbitrary storage system.' +
            'This storage must be a node module that exports a function ' +
            'called `storeResults`, expecting benchmarkResults as the first argument ' +
            'and a globalConfig as the second argument',
        type: 'string',
    },
    compareStats: {
        description:
            'Compares two benchmark runs for a given commit. ' +
            'If --externalStorage is provided it will use that source' +
            'Otherwise it will try to find the results on the file system',
        type: 'array',
    },
    gitIntegration: {
        default: undefined,
        description: 'Integrates with Git, posting the results of the benchmark or comparison',
        type: 'boolean',
    },
    generateHTML: {
        default: undefined,
        description: 'Generate a static HTML version of the results of the benchmrak or comparison',
        type: 'boolean',
    },
    dbAdapter: {
        default: undefined,
        description:
            'Override which database adapter is used. By default Best comes with `sql/sqlite` and `sql/postgres`',
        type: 'string',
    },
    dbURI: {
        default: undefined,
        description: 'Provide a connection URI or path to be passed to the database adapter',
        type: 'string',
    },
    dbToken: {
        default: undefined,
        description:
            'Some database providers (e.g. rest/frontend) communicate over HTTP(S) and this token is used for authorization.',
        type: 'string',
    },
    runner: {
        default: 'default',
        description:
            'Select the runner to execute the benchmarks.' +
            'Make sure you have defined `runnerConfig` options in your Best config file' +
            'By default it will use @best/runner-headless',
        type: 'string',
    },
    runnerConfig: {
        default: undefined,
        description: 'JSON representation of the configuration to use for the give runner',
        type: 'string',
    },
    useHttp: {
        default: true,
        description: 'Runs benchmarks against a temporary HTTP server (instead of using the "file:" protocol).',
        type: 'boolean',
    },
};

export function normalize(args: { [x: string]: any; _: string[]; $0: string }): CliConfig {
    const {
        _,
        help,
        clearCache,
        clearResults,
        showConfigs,
        disableInteractive,
        gitIntegration,
        generateHTML,
        useHttp,
        externalStorage,
        runner,
        runnerConfig,
        config,
        projects,
        iterations,
        compareStats,
        dbAdapter,
        dbURI,
        dbToken,
        runInBatch,
        runInBand,
    } = args;

    return {
        _,
        help: Boolean(help),
        clearCache: Boolean(clearCache),
        clearResults: Boolean(clearResults),
        useHttp: Boolean(useHttp),
        showConfigs: Boolean(showConfigs),
        runInBand: Boolean(runInBand),
        disableInteractive,
        runInBatch,
        gitIntegration,
        generateHTML,
        externalStorage,
        runner,
        runnerConfig: runnerConfig ? JSON.parse(runnerConfig) : {},
        config,
        projects: projects || [],
        iterations: iterations ? parseInt(iterations, 10) : undefined,
        compareStats,
        dbAdapter,
        dbURI,
        dbToken,
    };
}
