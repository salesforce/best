/* eslint-env node */
const ENV_PORT = process.env.PORT;
const STORE_PLUGIN = process.env.STORE_PLUGIN;
const DEFAULT_STORE_PLUGIN = './store-mocks';

module.exports = {
    PORT:  ENV_PORT || 3000,
    STORE: STORE_PLUGIN || DEFAULT_STORE_PLUGIN,
    API_VERSION: 'v1'
};
