/*
 * Copyright (c) 2019, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: MIT
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/MIT
*/

import { Pool } from 'pg'
import { SQLDatabase, SQLQueryResult } from '../db'
import { ApiDatabaseConfig } from '@best/types';
import { migrate } from './migrate';

export default class PostgresDatabase extends SQLDatabase {
    pool: Pool
    migrated = false;

    constructor(config: ApiDatabaseConfig) {
        super()
        this.pool = new Pool({
            connectionString: config.uri,
            ssl: config.ssl
        })
    }

    query(text: string, params: any[]): Promise<SQLQueryResult> {
        if (! this.migrated) { throw new Error('Database migrations have not been ensured.') }

        return this.pool.query(text, params)
    }

    async performMigrations() {
        await migrate(this.pool)
        this.migrated = true;
    }
}
