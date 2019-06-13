import SQLiteDatabase from './db'
import { SQLAdapter } from '../adapter'

export default class SQLiteAdapter extends SQLAdapter {
    constructor(config: any) {
        super(config, new SQLiteDatabase(config))
    }
}