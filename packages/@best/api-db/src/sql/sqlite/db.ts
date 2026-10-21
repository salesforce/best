/*
 * Copyright (c) 2019, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: MIT
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/MIT
 */

import { DatabaseSync } from 'node:sqlite';
import { SQLDatabase, SQLQueryResult } from '../db';
import { migrate } from './migrate';
import { ApiDatabaseConfig } from '@best/types';

// Primary result code for constraint violations, see https://www.sqlite.org/rescode.html
const SQLITE_CONSTRAINT = 19;

type SQLValue = null | number | bigint | string | Uint8Array;

// node:sqlite only binds null, numbers, bigints, strings and buffers, so mirror what `sqlite3` did for the rest
const normalizeParam = (param: unknown): SQLValue => {
    if (param instanceof Date) {
        return param.getTime();
    }

    if (typeof param === 'boolean') {
        return param ? 1 : 0;
    }

    return (param === undefined ? null : param) as SQLValue;
};

export default class SQLiteDatabase extends SQLDatabase {
    database: DatabaseSync;
    migrated = false;

    constructor(config: ApiDatabaseConfig) {
        super();
        this.database = new DatabaseSync(config.uri);
    }

    async query(text: string, params: any[]): Promise<SQLQueryResult> {
        if (!this.migrated) {
            throw new Error('Database migrations have not been ensured.');
        }

        const query = this.transformQuery(text);

        try {
            const rows = this.database.prepare(query).all(...params.map(normalizeParam)) as Record<string, unknown>[];

            return { rows: rows.map((row) => ({ ...row })) };
        } catch (err: any) {
            if (err.errcode !== undefined && (err.errcode & 0xff) === SQLITE_CONSTRAINT) {
                err.code = 'SQLITE_CONSTRAINT';
            }

            throw err;
        }
    }

    transformQuery(original: string): string {
        return original.replace(/(\$[\d]+)/g, '?');
    }

    async performMigrations() {
        await migrate(this.database);
        this.migrated = true;
    }
}
