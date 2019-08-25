/*
 * Copyright (c) 2019, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: MIT
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/MIT
*/

import SQLiteDatabase from './db'
import { SQLAdapter } from '../adapter'
import { ApiDatabaseConfig } from '@best/types';

export default class SQLiteAdapter extends SQLAdapter {
    constructor(config: ApiDatabaseConfig) {
        super(config, new SQLiteDatabase(config))
    }
}
