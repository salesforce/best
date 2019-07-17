const { createLogger, format, transports } = require('winston');
const expressWinston = require('express-winston');

const { __ENV__ } = require('../config');

const DEV_LOGGER_CONFIG = {
    format: format.combine(format.colorize(), format.simple()),
    meta: false,
};

const PROD_LOGGER_CONFIG = {
    format: format.json(),
    meta: true,
};

const LOGGER_CONFIG = {
    ...(__ENV__ === 'production' ? PROD_LOGGER_CONFIG : DEV_LOGGER_CONFIG),
    transports: [new transports.Console()],
};

const logger = createLogger(LOGGER_CONFIG);
const loggerMiddleware = expressWinston.logger(LOGGER_CONFIG);
const errorLoggerMiddleware = expressWinston.errorLogger(LOGGER_CONFIG);

module.exports = {
    logger,
    loggerMiddleware,
    errorLoggerMiddleware,
};
