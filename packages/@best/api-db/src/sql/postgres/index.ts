/*
 * Copyright (c) 2019, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: MIT
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/MIT
 */

import PostgresDatabase from './db';
import { SQLAdapter } from '../adapter';
import { ApiDatabaseConfig } from '@best/types';

export default class PostgresAdapter extends SQLAdapter {
    constructor(config: ApiDatabaseConfig) {
        super(config, new PostgresDatabase(config));
    }
}
