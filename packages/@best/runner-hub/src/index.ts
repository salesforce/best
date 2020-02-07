/*
 * Copyright (c) 2019, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: MIT
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/MIT
*/

import {
    BenchmarkResultsSnapshot,
    BuildConfig,
    FrozenGlobalConfig,
    FrozenProjectConfig,
    RunnerStream
} from "@best/types";
import AbstractRunner from "@best/runner-abstract";
import { HubClient } from "./HubClient";

export class Runner extends AbstractRunner {
    async run(benchmarkBuilds: BuildConfig[], projectConfig: FrozenProjectConfig, globalConfig: FrozenGlobalConfig, runnerLogStream: RunnerStream): Promise<BenchmarkResultsSnapshot[]> {
        throw new Error('DELETE ME');
    }

    async runBenchmarksInBatch(benchmarksBuilds: BuildConfig[], messager: RunnerStream): Promise<BenchmarkResultsSnapshot[]> {
        const { projectConfig, globalConfig } = benchmarksBuilds[0];
        const client = new HubClient();

        return client.runBenchmarks(benchmarksBuilds, projectConfig, globalConfig, messager);
    }
}
