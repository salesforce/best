/*
 * Copyright (c) 2019, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: MIT
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/MIT
*/

import { RunnerRemote } from "./runner-remote"
import AbstractRunner from "@best/runner-abstract";
import { BuildConfig, FrozenProjectConfig, FrozenGlobalConfig, RunnerStream, BenchmarkResultsSnapshot } from "@best/types";
export class Runner extends AbstractRunner {
    run(benchmarkBuilds: BuildConfig[], { benchmarkRunnerConfig }: FrozenProjectConfig, globalConfig: FrozenGlobalConfig, runnerLogStream: RunnerStream): Promise<BenchmarkResultsSnapshot[]> {
        const remoteRunner = new RunnerRemote(benchmarkBuilds.slice(), runnerLogStream, benchmarkRunnerConfig);
        return remoteRunner.run();
    }

    static isRemote = true;
}
