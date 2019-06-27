import path from 'path'
import fs from 'fs';
import { promisify } from 'util';
import { Pool } from 'pg';

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

type Migration = PartialMigration & MigrationContent

const buildMigrations = async (location: string): Promise<Migration[]> => {
    const migrationsPath = path.resolve(__dirname, location);

    const files = await asyncReadDir(migrationsPath);

    // we look for .js files since these will be pre-compiled by js
    const partialMigrations: PartialMigration[] = files.map(f => f.match(/^((\d+).(.*?))\.js$/)).reduce((migrations, match): PartialMigration[] => {
        if (! match) {
            return migrations;
        }

        const migration = { id: Number(match[2]), name: match[3], filename: match[1] }

        return [...migrations, migration];
    }, <PartialMigration[]>[]).sort((a, b) => Math.sign(a.id - b.id));

    const migrations: Migration[] = await Promise.all(partialMigrations.map(async (partial): Promise<Migration> => {
        const filename = path.resolve(migrationsPath, partial.filename);
        const content: MigrationContent = await import(filename);

        return {
            ...partial,
            ...content
        }
    }))

    return migrations
}

export const migrate = async (db: Pool, redoLast: boolean = false, location: string = 'migrations/', table = 'migrations'): Promise<boolean> => {
    const migrations = await buildMigrations(location);

    const client = await db.connect();

    await client.query(`CREATE TABLE IF NOT EXISTS "${table}" (id INTEGER PRIMARY KEY, name TEXT NOT NULL, up TEXT NOT NULL, down TEXT NOT NULL)`);

    const previous = await client.query(`SELECT * FROM ${table} ORDER BY id ASC`);
    let lastMigration = previous.rows[previous.rows.length - 1];

    if (redoLast && previous.rows.length > 0) {
        await client.query('BEGIN');
        try {
            await client.query(lastMigration.down);
            await client.query(`DELETE FROM "${table}" WHERE id = ?`, lastMigration.id);
            await client.query('COMMIT');
            lastMigration = null;
        } catch (err) {
            await client.query('ROLLBACK');
            client.release();
            throw err;
        }
    }

    const lastMigrationId = lastMigration ? lastMigration.id : 0;
    await Promise.all(migrations.map(async migration => {
        if (migration.id > lastMigrationId) {
            await client.query('BEGIN');
            try {
                await client.query(migration.up);
                await client.query(`INSERT INTO "${table}" (id, name, up, down) VALUES ($1, $2, $3, $4)`, [migration.id, migration.name, migration.up, migration.down]);
                await client.query('COMMIT');
            } catch (err) {
                await client.query('ROLLBACK');
                client.release();
                throw err;
            }
        }
    }))

    client.release();

    return true;
}