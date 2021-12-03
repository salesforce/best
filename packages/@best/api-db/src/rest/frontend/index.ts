/*
 * Copyright (c) 2019, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: MIT
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/MIT
*/

import { ApiDBAdapter, TemporarySnapshot } from '../../types'
import { ApiDatabaseConfig } from '@best/types';
import fetch from 'node-fetch';

/**
 * An implementation for a REST-based DB adapter.
 * It provides a way to save snapshots using a REST API provided by the frontend.
 */
export default class FrontendRestDbAdapter extends ApiDBAdapter {
    config: ApiDatabaseConfig

    constructor(config: ApiDatabaseConfig) {
        super(config);
        this.config = config;
    }

    async saveSnapshots(snapshots: TemporarySnapshot[], projectName: string): Promise<boolean> {
        const requestUrl = `${this.config.uri}/api/v1/${projectName}/snapshots`;

        const response = await fetch(requestUrl, {
            method: 'post',
            body: JSON.stringify(snapshots),
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.config.token}`
            },
        });

        // Log the response body for troubleshooting purposes
        if (!response.ok) {
            console.error(await response.text());
            return false;
        }

        return true;
    }

    async migrate() {
        // The migrate() function is called during results publishing, but it is not needed here.
        // We just need to make it a no-op as the server-side implementation handles the migration.
    }
}
