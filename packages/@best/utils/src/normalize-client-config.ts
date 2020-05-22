/*
 * Copyright (c) 2019, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: MIT
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/MIT
 */
import { RemoteClientConfig } from "@best/types";

export function normalizeClientConfig(config: any): RemoteClientConfig {
    const jobs = config.jobs ? parseInt(config.jobs, 10) : 0;
    let specs;
    if (config.specs && config.specs !== 'any') {
        try {
            specs = JSON.parse(config.specs);
        } catch {
            specs = { name: 'invalid_specs', version: 0 };
        }
    }

    return { jobs, specs, authToken: config.authToken };
}

export function normalizeSpecs(config: any) {
    try {
        return JSON.parse(config.specs);
    } catch {
        return [];
    }
}
