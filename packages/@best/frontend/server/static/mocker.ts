/*
 * Copyright (c) 2019, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: MIT
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/MIT
 */

import fs from 'fs';
import { promisify } from 'util';
import { ApiDatabaseConfig } from '@best/types';
import { buildMockedDataFromApi } from './builder';
import * as rollup from 'rollup';

const asyncRead = promisify(fs.readFile);

export interface MockerOptions {
    projectNames: string[];
    timingOptions: string[];
    config: { apiDatabase: ApiDatabaseConfig };
}

export const bestMocker = (options: MockerOptions): rollup.Plugin => ({
    name: 'best-frontend-mocker',
    load: async (id: string): Promise<string | null> => {
        // this is a bit fragile, but im not sure how it would be best to improve it.
        if (id.includes('store/api/api.js')) {
            try {
                const newPath = id.replace('api.js', 'mocked.js');
                const mockTemplate = await asyncRead(newPath, 'utf8');

                const mockedData = await buildMockedDataFromApi(options);

                if (mockTemplate && mockedData) {
                    return mockTemplate.replace('INSERT_MOCKED_DATA', JSON.stringify(mockedData));
                }
            } catch (_err) {
                return null;
            }
        }
        return null;
    },
});
