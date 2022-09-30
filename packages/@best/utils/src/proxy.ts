/*
 * Copyright (c) 2019, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: MIT
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/MIT
 */

import createHttpsProxyAgent from 'https-proxy-agent';

// NOTE: the proxy needs to be in the form of: "http://0.0.0.0:0000"
const PROXY = process.env.http_proxy || process.env.HTTP_PROXY;

export const proxifiedSocketOptions = (options: any) => {
    if (PROXY) {
        return {
            ...options,
            agent: createHttpsProxyAgent(PROXY) as any,
            timeout: 50000,
        };
    }

    return options;
};
