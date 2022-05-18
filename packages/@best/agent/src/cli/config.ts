/*
 * Copyright (c) 2019, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: MIT
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/MIT
 */
import { AgentConfig, RemoteHubConfig } from '@best/types';
import { coalesce } from '@best/utils';

const AGENT_CONFIG = process.env.AGENT_CONFIG ? JSON.parse(process.env.AGENT_CONFIG): {};
const AGENT_URI = process.env.AGENT_URI;
const AGENT_RUNNER = process.env.AGENT_RUNNER;
const AGENT_AUTH_TOKEN = process.env.AGENT_AUTH_TOKEN;

const REMOTE_HUB_CONFIG = process.env.REMOTE_HUB_CONFIG ? JSON.parse(process.env.REMOTE_HUB_CONFIG): {};
const REMOTE_HUB_URI = process.env.REMOTE_HUB_URI;
const REMOTE_HUB_AUTH_TOKEN = process.env.REMOTE_HUB_AUTH_TOKEN;
const REMOTE_HUB_ACCEPT_SELFSIGNED_CERT = process.env.REMOTE_HUB_ACCEPT_SELFSIGNED_CERT;

function normalizeArgOptions(argv: string[]): any {
    let arg;
    const normalizedArgs: any = {};
    while((arg = argv.shift()) !== undefined) {
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

export function getAgentConfig(): AgentConfig {
    return {
        ...AGENT_CONFIG,
        uri: argv.uri || AGENT_URI || AGENT_CONFIG.uri,
        runner: argv.runner || AGENT_RUNNER || AGENT_CONFIG.runner,
        authToken: argv.authToken || AGENT_AUTH_TOKEN || AGENT_CONFIG.authToken
    };
}

/**
 * Tries to convert provided value to a boolean for a set of known/supported strings.
 * @param val the value to be converted to boolean
 * @returns `true` for 'true', 'yes' or '1'.
 *          `false` for 'false', 'no', '0'.
 *          `null` when value is null.
 *          `undefined` when value is undefined or does not match one of supported values.
 */
function tryConvertToBoolean(val: string | undefined | null): boolean | undefined | null {
    // Preserve the input's value if it is either null or undefined
    if (val === null || val === undefined) {
        return val;
    }

    // Convert to boolean for known/supported values
    switch (val.toLowerCase().trim()) {
        case 'true':
        case 'yes':
        case '1':
            return true;
        case 'false':
        case 'no':
        case '0':
            return false;
    }
}

export function getRemoteHubConfig(): RemoteHubConfig {
    return {
        ...REMOTE_HUB_CONFIG,
        uri: argv.remoteHubUri || REMOTE_HUB_URI || REMOTE_HUB_CONFIG.uri,
        authToken: argv.remoteHubAuthToken || REMOTE_HUB_AUTH_TOKEN || REMOTE_HUB_CONFIG.authToken,

        // Since this config parameter is of a boolean type, we don't want to assume that the absence of
        // the individual input's value is automatically considered as boolean false - we want to
        // preserve the null or undefined value.
        acceptSelfSignedCert: coalesce(
            tryConvertToBoolean(argv.acceptSelfSignedCert),
            tryConvertToBoolean(REMOTE_HUB_ACCEPT_SELFSIGNED_CERT),
            tryConvertToBoolean(REMOTE_HUB_CONFIG.acceptSelfSignedCert)
        )
    };
}
