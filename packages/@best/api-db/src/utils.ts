import { ApiDBAdapter } from './types';
import path from 'path';

const LOCAL_ADAPTERS = ['sql/postgres'];

// Handles default exports for both ES5 and ES6 syntax
function req(id: string) {
    const r = require(id);
    return r.default || r;
}

export const loadDbFromConfig = (globalConfig: any): ApiDBAdapter => {
    const config = globalConfig.apiDatabase;

    if (LOCAL_ADAPTERS.includes(config.adapter)) {
        const localAdapter: typeof ApiDBAdapter = req(path.resolve(__dirname, config.adapter));

        return new localAdapter(config);
    } else {
        const remoteAdapter: typeof ApiDBAdapter = req(config.adapter);

        return new remoteAdapter(config);
    }
}