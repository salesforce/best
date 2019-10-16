/*
 * Copyright (c) 2019, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: MIT
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/MIT
*/

import {
    BenchmarkInfo,
    BenchmarkResultsSnapshot,
    BuildConfig,
    FrozenGlobalConfig,
    FrozenProjectConfig,
    RunnerStream
} from "@best/types";
import AbstractRunner from "@best/runner-abstract";
import { HubClient } from "./HubClient";

export class Runner extends AbstractRunner {
    async run(benchmarkInfo: BenchmarkInfo, projectConfig: FrozenProjectConfig, globalConfig: FrozenGlobalConfig, runnerLogStream: RunnerStream): Promise<BenchmarkResultsSnapshot> {
        const client = new HubClient();
        const results = await client.runBenchmarks([benchmarkInfo], projectConfig, globalConfig, runnerLogStream);

        return results[0];
    }

    async runBenchmarksInBatch(benchmarksBuilds: BuildConfig[], messager: RunnerStream): Promise<BenchmarkResultsSnapshot[]> {
        const { projectConfig, globalConfig } = benchmarksBuilds[0];
        const client = new HubClient();

        return client.runBenchmarks(benchmarksBuilds, projectConfig, globalConfig, messager);
    }
}
