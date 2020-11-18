import { ApiDatabaseConfig } from '@best/types';
import { SQLDatabase, SQLQueryResult } from '../db';

class TestDatabase extends SQLDatabase {
    constructor(config: ApiDatabaseConfig) {
        super(config);
    }

    query = jest.fn((text: string, params: any[]): Promise<SQLQueryResult> => {
        return Promise.resolve({
            rows: [{ text, params }]
        });
    });
}

const testConfigBasic: ApiDatabaseConfig = {
    adapter: 'sql/postgres',
    uri: 'postgresql://localhost',
    ssl: false,
};

const testConfigExcludeTemporary: ApiDatabaseConfig = {
    ...testConfigBasic,
    filtering: {
        allowTemporary: false
    }
};

const testConfigIncludeTemporary: ApiDatabaseConfig = {
    ...testConfigBasic,
    filtering: {
        allowTemporary: true
    }
};

describe('SQLDatabase', () => {
    describe('fetchSnapshots()', () => {
        it('excludes temporary results with basic db config', async () => {
            const database = new TestDatabase(testConfigBasic);
            await database.fetchSnapshots(1, undefined);
            expect(database.query).toHaveBeenCalledWith(
                `SELECT * FROM snapshots WHERE "project_id" = $1 AND "temporary" = '0' ORDER BY commit_date, name`,
                [1]
            );
        });

        it('excludes temporary results with basic db config with since', async () => {
            const database = new TestDatabase(testConfigBasic);
            const date = new Date();
            await database.fetchSnapshots(1, date);
            expect(database.query).toHaveBeenCalledWith(
                `SELECT * FROM snapshots WHERE "project_id" = $1 AND "temporary" = '0' AND "commit_date" > $2 ORDER BY commit_date, name`,
                [1, date]
            );
        });

        it('excludes temporary results with explicit exclusion', async () => {
            const database = new TestDatabase(testConfigExcludeTemporary);
            await database.fetchSnapshots(1, undefined);
            expect(database.query).toHaveBeenCalledWith(
                `SELECT * FROM snapshots WHERE "project_id" = $1 AND "temporary" = '0' ORDER BY commit_date, name`,
                [1]
            );
        });

        it('excludes temporary results with explicit exclusion with since', async () => {
            const database = new TestDatabase(testConfigExcludeTemporary);
            const date = new Date();
            await database.fetchSnapshots(1, date);
            expect(database.query).toHaveBeenCalledWith(
                `SELECT * FROM snapshots WHERE "project_id" = $1 AND "temporary" = '0' AND "commit_date" > $2 ORDER BY commit_date, name`,
                [1, date]
            );
        });

        it('includes temporary results with explicit inclusion', async () => {
            const database = new TestDatabase(testConfigIncludeTemporary);
            await database.fetchSnapshots(1, undefined);
            expect(database.query).toHaveBeenCalledWith(
                `SELECT * FROM snapshots WHERE "project_id" = $1  ORDER BY commit_date, name`,
                [1]
            );
        });

        it('includes temporary results with explicit inclusion with since', async () => {
            const database = new TestDatabase(testConfigIncludeTemporary);
            const date = new Date();
            await database.fetchSnapshots(1, date);
            expect(database.query).toHaveBeenCalledWith(
                `SELECT * FROM snapshots WHERE "project_id" = $1  AND "commit_date" > $2 ORDER BY commit_date, name`,
                [1, date]
            );
        });
    });
});
