/*
 * Copyright (c) 2019, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: MIT
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/MIT
 */
import { RemoteClientConfig } from '@best/types';
import { BrowserSpec, AgentConfig } from '@best/types';
import { matchSpecs } from '@best/utils';

function validateToken(token?: string, requiredToken?: string) {
    return requiredToken ? requiredToken === token : true;
}

function validateSpecs(specs?: BrowserSpec, agentSpecs: BrowserSpec[] = []) {
    return specs ? matchSpecs(specs, agentSpecs) : true;
}

function validateJobs(jobs: number) {
    return jobs > 0;
}

export function validateConfig(
    config: RemoteClientConfig,
    agentConfig: AgentConfig,
    runnerSpecs: BrowserSpec[],
    socketId: string,
): string | undefined {
    if (!validateToken(config.authToken, agentConfig.authToken)) {
        console.log(`[AGENT] Rejecting client (${socketId}): Token missmatch`);
        return `Unable to match token`;
    }

    if (!validateSpecs(config.specs, runnerSpecs)) {
        console.log(`[AGENT] Rejecting client (${socketId}): Invalid specs ${JSON.stringify(config.specs)}`);
        return `Unable to match specs.`;
    }

    if (!validateJobs(config.jobs)) {
        console.log(`[AGENT] Rejecting client (${socketId}): No jobs specified`);
        return `Client must specify number of jobs in advance.`;
    }
}
