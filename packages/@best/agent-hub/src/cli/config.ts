/*
 * Copyright (c) 2019, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: MIT
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/MIT
 */
import { AgentConfig } from '@best/types';

const HUB_CONFIG = process.env.HUB_CONFIG ? JSON.parse(process.env.HUB_CONFIG) : {};
const HUB_URI = process.env.HUB_URI;
const HUB_AUTH_TOKEN = process.env.HUB_AUTH_TOKEN;

function normalizeArgOptions(argv: string[]): any {
    let arg;
    const normalizedArgs: any = {};
    while ((arg = argv.shift()) !== undefined) {
        if (arg.startsWith('--')) {
            if (arg.includes('=')) {
                const [key, value] = arg.split('=');
                normalizedArgs[key.slice(2)] = value;
            } else {
                normalizedArgs[arg.slice(2)] = argv.shift();
            }
        }
    }

    return normalizedArgs;
}

const argv = normalizeArgOptions(process.argv.slice(2));

export function getHubConfig(): AgentConfig {
    return {
        ...HUB_CONFIG,
        uri: argv.hubUri || HUB_URI || HUB_CONFIG.uri,
        authToken: argv.hubAuthToken || HUB_AUTH_TOKEN || HUB_CONFIG.authToken,
    };
}
