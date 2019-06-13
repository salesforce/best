import { ApiDB } from './types';
import path from 'path';

const LOCAL_ADAPTERS = ['postgres'];

// Handles default exports for both ES5 and ES6 syntax
function req(id: string) {
    const r = require(id);
    return r.default || r;
}

export const loadDbFromConfig = (globalConfig: any): ApiDB => {
    const config = globalConfig.apiDatabase;

    if (LOCAL_ADAPTERS.includes(config.adapter)) {
        const localAdapter: typeof ApiDB = req(path.resolve(__dirname, config.adapter));

        return new localAdapter(config);
    } else {
        const remoteAdapter: typeof ApiDB = req(config.adapter);

        return new remoteAdapter(config);
    }
}