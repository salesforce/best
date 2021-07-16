/*
 * Copyright (c) 2019, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: MIT
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/MIT
*/

import path from 'path';
import { FrozenGlobalConfig, FrontendConfig } from '@best/types';
import { req } from '@best/utils';
import { ApiDBAdapter } from './types';

const LOCAL_ADAPTERS = ['sql/postgres', 'sql/sqlite', 'rest/frontend'];

export const loadDbFromConfig = (globalConfig: FrozenGlobalConfig | FrontendConfig): ApiDBAdapter => {
    const config = globalConfig.apiDatabase;

    if (LOCAL_ADAPTERS.includes(config.adapter)) {
        const localAdapter: typeof ApiDBAdapter = req(path.resolve(__dirname, config.adapter));

        return new localAdapter(config);
    } else {
        const remoteAdapter: typeof ApiDBAdapter = req(config.adapter);

        return new remoteAdapter(config);
    }
}
