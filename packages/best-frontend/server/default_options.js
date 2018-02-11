/* eslint-env node */
const ENV_PORT = process.env.PORT;
const STORE_PLUGIN = process.env.STORE_PLUGIN;
const DEFAULT_STORE_PLUGIN = './server/store-mocks';

module.exports = {
    port:  ENV_PORT || 3000,
    store: STORE_PLUGIN || DEFAULT_STORE_PLUGIN,
    apiVersion: 'v1',
};
