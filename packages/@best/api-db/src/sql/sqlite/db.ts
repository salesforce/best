import sqlite from 'sqlite'
import { SQLDatabase, SQLQueryResult } from '../db'

export default class SQLiteDatabase extends SQLDatabase {
    dbPromise: any
    constructor(config: any) {
        super()
        this.dbPromise = sqlite.open(config.path, { verbose: true })
    }

    async query(text: string, params: any[]): Promise<SQLQueryResult> {
        const database = await this.dbPromise
        const query = this.transformQuery(text)

        return {
            rows: await database.all(query, ...params)
        }
    }

    transformQuery(original: string): string {
        return original.replace(/(\$[\d]+)/g, '?')
    }
}