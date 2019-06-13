import { Pool } from 'pg'
import { SQLDatabase, SQLQueryResult } from '../db'

export default class PostgresDatabase extends SQLDatabase {
    pool: Pool
    constructor(config: any) {
        super()
        this.pool = new Pool(config)
    }

    query(text: string, params: any[]): Promise<SQLQueryResult> {
        return this.pool.query(text, params)
    }
}