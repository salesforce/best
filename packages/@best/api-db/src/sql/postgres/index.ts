import PostgresDatabase from './db'
import { SQLAdapter } from '../adapter'
import { ApiDatabaseConfig } from '@best/types';

export default class PostgresAdapter extends SQLAdapter {
    constructor(config: ApiDatabaseConfig) {
        super(config, new PostgresDatabase(config))
    }
}
