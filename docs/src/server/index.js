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
