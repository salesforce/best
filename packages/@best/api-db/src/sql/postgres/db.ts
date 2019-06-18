import { Pool } from 'pg'
import { SQLDatabase, SQLQueryResult } from '../db'
import { ApiDatabaseConfig } from '@best/config';

export default class PostgresDatabase extends SQLDatabase {
    pool: Pool
    constructor(config: ApiDatabaseConfig) {
        super()
        this.pool = new Pool({
            connectionString: config.path
        })
    }

    query(text: string, params: any[]): Promise<SQLQueryResult> {
        return this.pool.query(text, params)
    }
}