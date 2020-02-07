/*
 * Copyright (c) 2019, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: MIT
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/MIT
*/

import { BuildConfig, BenchmarkResultsSnapshot, RunnerStream, BrowserSpec, BenchmarksBundle } from "@best/types";
import AbstractRunner from "@best/runner-abstract";

interface ConcreteRunner extends AbstractRunner {
    new(config?: any): ConcreteRunner;
    getBrowserSpecs(): Promise<BrowserSpec[]>
}

function runBenchmarksBundle(benchmarkBuild: BenchmarksBundle, runnerLogStream: RunnerStream): Promise<BenchmarkResultsSnapshot[]> {
    const { projectConfig, globalConfig, benchmarkBuilds } = benchmarkBuild;
    const { benchmarkRunner } = projectConfig;
    let RunnerCtor: ConcreteRunner, runnerInstance: ConcreteRunner;

    try {
        const RunnerModule: any = require(benchmarkRunner);
        RunnerCtor = RunnerModule.Runner || RunnerModule.default || RunnerModule;
    } catch (e) {
        throw new Error(`Runner "${benchmarkRunner}" not found.`);
    }

    // Create a runner instance
    try {
        runnerInstance = new RunnerCtor(projectConfig.benchmarkRunnerConfig);
    } catch (e) {
        throw new Error(`Runner "${benchmarkRunner}" does not expose a constructor.`);
    }

    return runnerInstance.run(benchmarkBuilds, projectConfig, globalConfig, runnerLogStream);
}

function loadRunnerModule(benchmarkRunner: string): ConcreteRunner {
    try {
        const RunnerModule: any = require(benchmarkRunner);
        return RunnerModule.Runner || RunnerModule.default || RunnerModule;
    } catch (e) {
        throw new Error(`Runner "${benchmarkRunner}" not found.`);
    }
}

export async function runBenchmarks(benchmarksBuilds: BenchmarksBundle[], messager: RunnerStream): Promise<BenchmarkResultsSnapshot[]> {
    const results = [];

    for (const benchmarkBundle of benchmarksBuilds) {
        const benchmarkResults = await runBenchmarksBundle(benchmarkBundle, messager);
        results.push(...benchmarkResults);
    }

    return results;
}

export async function getBrowserSpecs(runner: string | BuildConfig): Promise<BrowserSpec[]> {
    const benchmarkRunner = typeof runner === 'string' ? runner: runner.projectConfig.benchmarkRunner;
    const RunnerModule: ConcreteRunner = loadRunnerModule(benchmarkRunner);
    return RunnerModule.getBrowserSpecs();
}

export function validateRunner(runner: string): void {
    loadRunnerModule(runner);
}
