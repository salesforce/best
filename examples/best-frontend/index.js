/* eslint-env node */
/* eslint new-cap: ["error", { "capIsNew": false }] */
const express = require('express');
const app = express();
const config = require('./best-fe.config.js');
const BestFE = require('@best/frontend');

const PORT = process.env.PORT || config.port || 3000;
app.use(BestFE(config));

app.listen(PORT, () => {
    console.log('[%s] Listening on http://localhost:%d', app.settings.env, PORT);
});
