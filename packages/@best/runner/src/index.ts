/*
 * Copyright (c) 2019, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: MIT
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/MIT
*/

import { BuildConfig, BenchmarkResultsSnapshot, RunnerStream, BrowserSpec, BenchmarksBundle } from "@best/types";
import AbstractRunner from "@best/runner-abstract";
import { matchSpecs } from "@best/utils";

interface ConcreteRunner extends AbstractRunner {
    new(config?: any): ConcreteRunner;
    getBrowserSpecs(): Promise<BrowserSpec[]>
    isRemote: boolean;
}

async function runBenchmarksBundle(benchmarkBuild: BenchmarksBundle, runnerLogStream: RunnerStream): Promise<BenchmarkResultsSnapshot[]> {
    const { projectConfig, globalConfig, benchmarkBuilds } = benchmarkBuild;
    const { benchmarkRunner, benchmarkRunnerConfig } = projectConfig;

    if (!benchmarkRunnerConfig.specs) {
        throw new Error('You must provide specifications for the runner in your best config.')
    }

    const RunnerCtor = loadRunnerModule(benchmarkRunner);

    // If the runner is going to run locally, check the specification now
    // Note that we avoid delegating the spec matching to the runner in case it does not implements it
    if (!RunnerCtor.isRemote) {
        const runnerSpecs = await RunnerCtor.getBrowserSpecs();
        if (!matchSpecs(benchmarkRunnerConfig.specs, runnerSpecs)) {
            throw new Error(`Specs: ${JSON.stringify(benchmarkRunnerConfig.specs)} do not match any avaible on the runner`);
        }
    }

    const runnerInstance: ConcreteRunner = new RunnerCtor(projectConfig.benchmarkRunnerConfig);
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
