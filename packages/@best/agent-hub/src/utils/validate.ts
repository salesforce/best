/*
 * Copyright (c) 2019, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: MIT
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/MIT
 */
import { RemoteClientConfig } from "@best/types";
import { BrowserSpec, HubConfig } from "@best/types";
import { matchSpecs } from "@best/utils";

export function validateToken(token?: string, requiredToken?: string) {
    return requiredToken ? requiredToken === token : true;
}

function validateSpecs(specs?: BrowserSpec, agentSpecs: BrowserSpec[] = []) {
    return specs ? matchSpecs(specs, agentSpecs): true;
}

export function validateConfig(config: RemoteClientConfig, agentConfig: HubConfig, agentSpecs: BrowserSpec[], socketId: string): string | undefined {
    if (!validateToken(config.authToken, agentConfig.authToken)) {
        console.log(`[AGENT] Rejecting client (${socketId}): Token missmatch`);
        return `Unable to match token`;
    }

    if (!validateSpecs(config.specs, agentSpecs)) {
        console.log(`[AGENT] Rejecting client (${socketId}): Invalid specs ${JSON.stringify(config.specs)}`);
        return `Unable to match specs.`;
    }
}
