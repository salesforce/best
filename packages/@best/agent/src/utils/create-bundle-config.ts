/*
 * Copyright (c) 2019, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: MIT
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/MIT
 */
import { BuildConfig, BenchmarksBundle } from '@best/types';
import { AgentConfig } from '@best/types';

export function createBundleConfig(benchmarkBuild: BuildConfig, agentConfig: AgentConfig): BenchmarksBundle[] {
    (benchmarkBuild.projectConfig as any).benchmarkRunner = agentConfig.runner;

    return [
        {
            projectName: benchmarkBuild.projectConfig.projectName,
            projectConfig: benchmarkBuild.projectConfig,
            globalConfig: benchmarkBuild.globalConfig,
            benchmarkBuilds: [benchmarkBuild],
        },
    ];
}
