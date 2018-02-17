/* eslint-env node */
/* eslint new-cap: ["error", { "capIsNew": false }] */

/*
 * NOTE:
 * THIS FILE IS FOR DEVELOPMENT TESTING ONLY
*/

const express = require('express');
const BestFE = require('./index');
const PORT = process.env.PORT || 3000;
const app = express();

const config = {
    title: 'Best',
    // store: "@best/store-aws",
    storeConfig: {
        // Config shall be passed as env parameters
        // AWS_ACCESS_KEY_ID:
        // AWS_BUCKET_NAME:
        // AWS_REGION
        // AWS_SECRET_ACCESS_KEY
    },
    githubConfig: {
        // private
        // host
        // projectsMapping
        // GIT_APP_ID
        // GIT_ORG
    },
    excludeBenchmarks: [],
};

app.use(BestFE(config));
app.listen(PORT, () => {
    console.log('[%s] Listening on http://localhost:%d', app.settings.env, PORT);
});
