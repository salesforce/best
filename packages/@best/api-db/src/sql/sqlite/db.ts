/*
 * Copyright (c) 2019, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: MIT
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/MIT
*/

import sqlite, { Database } from 'sqlite'
import { SQLDatabase, SQLQueryResult } from '../db'
import { migrate } from './migrate';
import { ApiDatabaseConfig } from '@best/types';

export default class SQLiteDatabase extends SQLDatabase {
    dbPromise: Promise<Database>
    migrated = false;

    constructor(config: ApiDatabaseConfig) {
        super(config);
        this.dbPromise = sqlite.open(config.uri, { verbose: true })
    }

    async query(text: string, params: any[]): Promise<SQLQueryResult> {
        if (! this.migrated) { throw new Error('Database migrations have not been ensured.') }

        const database = await this.dbPromise
        const query = this.transformQuery(text)

        return {
            rows: await database.all(query, ...params)
        }
    }

    transformQuery(original: string): string {
        return original.replace(/(\$[\d]+)/g, '?')
    }

    async performMigrations() {
        const database = await this.dbPromise
        await migrate(database)
        this.migrated = true;
    }
}
