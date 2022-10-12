/*
 * Copyright (c) 2019, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: MIT
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/MIT
 */

import { ApiDBAdapter, TemporarySnapshot } from '../../types';
import { ApiDatabaseConfig } from '@best/types';
import https from 'https';
import HttpsProxyAgent from 'https-proxy-agent';

/**
 * An implementation for a REST-based DB adapter.
 * It provides a way to save snapshots using a REST API provided by the frontend.
 */
export default class FrontendRestDbAdapter extends ApiDBAdapter {
    config: ApiDatabaseConfig;

    constructor(config: ApiDatabaseConfig) {
        super(config);
        this.config = config;
    }

    request(url: string | URL, options: https.RequestOptions, payload: string): Promise<any> {
        return new Promise((resolve, reject) => {
            // The 'https' library does not natively support requests over a proxy.
            // We can still add proxy support by setting `options.agent` to an instance of `https-proxy-agent` agent.
            // More details on what an agent is responsible for can be found here: https://nodejs.org/docs/latest-v14.x/api/http.html#http_class_http_agent
            const proxy = process.env.HTTP_PROXY;
            if (proxy) {
                // @ts-ignore
                options.agent = new HttpsProxyAgent(proxy);
            }

            const req = https.request(url, options, (response) => {
                let responseBody = '';

                response.on('data', (chunk) => {
                    responseBody += chunk;
                });

                response.on('end', () => {
                    resolve({ ok: true, body: responseBody });
                });
            });

            req.on('error', (error) => {
                reject({ ok: false, error });
            });

            req.write(payload);
            req.end();
        });
    }

    async saveSnapshots(snapshots: TemporarySnapshot[], projectName: string): Promise<boolean> {
        const requestUrl = `${this.config.uri}/api/v1/${projectName}/snapshots`;
        const payload = JSON.stringify(snapshots);
        const options = {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${this.config.token}`,
            },
        };

        const response = await this.request(requestUrl, options, payload);

        if (!response.ok) {
            console.error(response.error);
            return false;
        }

        return true;
    }

    async migrate() {
        // The migrate() function is called during results publishing, but it is not needed here.
        // We just need to make it a no-op as the server-side implementation handles the migration.
    }
}
