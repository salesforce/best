import PostgresDatabase from './db'
import { SQLAdapter } from '../adapter'

export default class PostgresAdapter extends SQLAdapter {
    constructor(config: any) {
        super(config, new PostgresDatabase(config))
    }
}