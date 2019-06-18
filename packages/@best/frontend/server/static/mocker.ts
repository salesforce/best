import fs from 'fs';
import { promisify } from 'util';
import { ApiDatabaseConfig } from '@best/types';
import { buildMockedDataFromApi } from './builder'

const asyncRead = promisify(fs.readFile);

export interface MockerOptions {
    projectIds: number[];
    timingOptions: string[];
    branches: string[];
    config: { apiDatabase: ApiDatabaseConfig };
}

export const bestMocker = (options: MockerOptions) => ({
    name: 'best-frontend-mocker',
    load: async (id: string) => {
        // this is a bit fragile, but im not sure how it would be best to improve it.
        if (id.includes('store/api/api.js')) {
            try {
                const newPath = id.replace('api.js', 'mocked.js');
                const mockTemplate = await asyncRead(newPath, 'utf8');

                const mockedData = await buildMockedDataFromApi(options);

                if (mockTemplate && mockedData) {
                    return mockTemplate.replace('INSERT_MOCKED_DATA', JSON.stringify(mockedData));
                }
            } catch (err) {
                console.error('[Best Frontend Mocker] Could not properly load mocked api');
            }
        }
        return null;
    }
})