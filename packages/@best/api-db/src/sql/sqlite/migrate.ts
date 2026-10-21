/*
 * Copyright (c) 2019, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: MIT
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/MIT
 */

import path from 'path';
import fs from 'fs';
import { promisify } from 'util';
import { DatabaseSync } from 'node:sqlite';

const asyncReadDir = promisify(fs.readdir);

interface MigrationContent {
    up: string;
    down: string;
}

interface PartialMigration {
    id: number;
    name: string;
    filename: string;
}

type Migration = PartialMigration & MigrationContent;

const buildMigrations = async (location: string): Promise<Migration[]> => {
    const migrationsPath = path.resolve(__dirname, location);

    const files = await asyncReadDir(migrationsPath);

    // we look for .js files since these will be pre-compiled by js
    const partialMigrations: PartialMigration[] = files
        .map((f) => f.match(/^((\d+).(.*?))\.js$/))
        .reduce(
            (migrations, match): PartialMigration[] => {
                if (!match) {
                    return migrations;
                }

                const migration = { id: Number(match[2]), name: match[3], filename: match[1] };

                return [...migrations, migration];
            },
            <PartialMigration[]>[],
        )
        .sort((a, b) => Math.sign(a.id - b.id));

    const migrations: Migration[] = await Promise.all(
        partialMigrations.map(async (partial): Promise<Migration> => {
            const filename = path.resolve(migrationsPath, partial.filename);
            const content: MigrationContent = await import(filename);

            return {
                ...partial,
                ...content,
            };
        }),
    );

    return migrations;
};

// modified from https://github.com/kriasoft/node-sqlite/blob/master/src/Database.js#L148
export const migrate = async (
    db: DatabaseSync,
    redoLast: boolean = false,
    location: string = 'migrations/',
    table = 'migrations',
): Promise<boolean> => {
    const migrations = await buildMigrations(location);

    db.exec(
        `CREATE TABLE IF NOT EXISTS "${table}" (id INTEGER PRIMARY KEY, name TEXT NOT NULL, up TEXT NOT NULL, down TEXT NOT NULL)`,
    );

    const previous = db.prepare(`SELECT * FROM ${table} ORDER BY id ASC`).all() as unknown as Migration[];
    let lastMigration: Migration | null = previous[previous.length - 1] ?? null;

    if (redoLast && lastMigration) {
        db.exec('BEGIN');
        try {
            db.exec(lastMigration.down);
            db.prepare(`DELETE FROM "${table}" WHERE id = ?`).run(lastMigration.id);
            db.exec('COMMIT');
            lastMigration = null;
        } catch (err) {
            db.exec('ROLLBACK');
            throw err;
        }
    }

    const lastMigrationId = lastMigration ? lastMigration.id : 0;

    // the driver is synchronous and a connection supports a single transaction, so apply migrations in order
    for (const migration of migrations) {
        if (migration.id > lastMigrationId) {
            db.exec('BEGIN');
            try {
                db.exec(migration.up);
                db.prepare(`INSERT INTO "${table}" (id, name, up, down) VALUES (?, ?, ?, ?)`).run(
                    migration.id,
                    migration.name,
                    migration.up,
                    migration.down,
                );
                db.exec('COMMIT');
            } catch (err) {
                db.exec('ROLLBACK');
                throw err;
            }
        }
    }

    return true;
};
