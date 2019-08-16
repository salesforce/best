/*
 * Copyright (c) 2019, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: MIT
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/MIT
*/

/* eslint-disable no-console */
const os = require('os');
const { createApp } = require('./server');
const http = require('http');
const { logger } = require('./utils/logger');
const { PORT } = require('./config');

(async function() {
    const app = await createApp();
    const server = http.createServer(app);
    server.listen(PORT, function() {
        logger.info(`Application available at: http://${os.hostname}:${PORT}`);
    });
})();

process.on('unhandledRejection', (err, promise) => {
    console.log(err);
    process.exit(1);
});
