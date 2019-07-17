/* eslint-disable no-console */
const buildAssets = require('./build-assets');

buildAssets().catch(err => {
    console.log(err);
    throw err;
});
