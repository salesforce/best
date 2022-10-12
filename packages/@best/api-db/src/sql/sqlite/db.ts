/*
 * Copyright (c) 2019, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: MIT
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/MIT
 */

import { open, Database } from 'sqlite';
import sqlite3 from 'sqlite3';
import { SQLDatabase, SQLQueryResult } from '../db';
import { migrate } from './migrate';
import { ApiDatabaseConfig } from '@best/types';

sqlite3.verbose(); // enable verbose mode

export default class SQLiteDatabase extends SQLDatabase {
    dbPromise: Promise<Database>;
    migrated = false;

    constructor(config: ApiDatabaseConfig) {
        super();
        this.dbPromise = open({ filename: config.uri, driver: sqlite3.Database });
    }

    async query(text: string, params: any[]): Promise<SQLQueryResult> {
        if (!this.migrated) {
            throw new Error('Database migrations have not been ensured.');
        }

        const database = await this.dbPromise;
        const query = this.transformQuery(text);

        return {
            rows: await database.all(query, ...params),
        };
    }

    transformQuery(original: string): string {
        return original.replace(/(\$[\d]+)/g, '?');
    }

    async performMigrations() {
        const database = await this.dbPromise;
        await migrate(database);
        this.migrated = true;
    }
}
