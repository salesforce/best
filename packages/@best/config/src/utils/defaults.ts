/*
 * Copyright (c) 2019, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: MIT
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/MIT
*/

import { cacheDirectory } from '@best/utils';
import { BenchmarkMetricNames } from '@best/types';

const defaultOptions = {
    cache: true,
    gitIntegration: false,
    mainBranch: 'master',
    commentThreshold: 5,
    specs: undefined,
    generateHTML: false,
    apiDatabase: {
        adapter: 'sql/sqlite',
        uri: '<rootDir>/__benchmarks_results__/best.sqlite'
    },
    metrics: ['aggregate', 'script', 'recalculatestyles', 'layout', 'updatelayertree', 'paint', 'compositelayers', 'system', 'idle'] as BenchmarkMetricNames[],
    cacheDirectory: cacheDirectory(),
    useHttp: false,
    assets: [],
    openPages: false,
    moduleDirectories: ['node_modules'],
    moduleFileExtensions: ['js'],
    moduleNameMapper: {},
    modulePathIgnorePatterns: [],
    runner: "default",
    runners: [{
        alias: "default",
        runner: '@best/runner-headless'
    }],
    plugins: [],
    projects: [],
    runInBand: false,
    runnerConfig: {},
    benchmarkEnvironment: 'production',
    benchmarkMaxDuration: 1000 * 15, // 15s
    benchmarkMinIterations: 30,
    benchmarkOnClient: false,
    benchmarkIterations: 0,
    benchmarkOutput: '<rootDir>/__benchmarks_results__',
    benchmarkEnvironmentOptions: {},
    benchmarkCustomAssets: '<rootDir>/__benchmarks__/assets',
    testMatch: ['**/__benchmarks__/**/*.benchmark.js'],
    testPathIgnorePatterns: [
        '**/__benchmarks_results__/**',
        '**/node_modules/**',
        '**/__tests__/**'
    ],

    // Calculate statistics on entire distributions (including possible outliers).
    samplesQuantileThreshold: 0.8,

    // Don't try to normalize distributions.
    // normalize: false,

    // Show every metric (e.g. "duration" and "runDuration") in CLI output.
    // outputMetricNames: '*',

    // Don't show totals for each metric in a benchmark table.
    // outputTotals: false,

    // Don't show histograms for each distribution in CLI output.
    // outputHistograms: false,

    // If showing histograms, show every one.
    // outputHistogramNames: '*',

    // If histograms are shown, hide long tails by omitting the top and bottom 5%.
    // histogramQuantileRange: [0.05, 0.95],

    // If histograms are shown, make them a limited number of characters wide.
    // histogramMaxWidth: 50,

    rootDir: process.cwd(),
};

export default defaultOptions;
