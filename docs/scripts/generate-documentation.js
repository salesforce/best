/* eslint-disable no-console */
const buildDocumentation = require('./build-documentation');

buildDocumentation().catch(err => {
    console.log(err);
    throw err;
});
