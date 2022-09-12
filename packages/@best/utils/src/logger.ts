/*
 * Copyright (c) 2019, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: MIT
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/MIT
 */

import pc from 'picocolors';
import { Format } from 'logform';
import { createLogger, format, transports } from 'winston';

type LoggerConfigs = {
    label: string;
};
export class Logger {
    private static customFormat: Format = format.printf((logData) => {
        const msg = `${logData.timestamp} | ${logData.level.toUpperCase()} | ${logData.label.toUpperCase()} | ${
            logData.stack || logData.message
        }`;

        if (!Logger.showColors) {
            return msg;
        }

        switch (logData.level) {
            case 'warn':
                return pc.yellow(msg);
            case 'error':
                return pc.red(msg);
            default:
                return msg;
        }
    });

    private static customTimestampFormat: Format = format.timestamp({
        format: 'YYYY-MM-DD HH:mm:ss.SSS',
    });

    public static getLogger(configs: LoggerConfigs) {
        /*
         * Do not output the text in color if running in production
         * or if the terminal doesn't support colors.
         */
        Logger.showColors = process.env.NODE_ENV !== 'production' && pc.isColorSupported;

        return createLogger({
            exitOnError: false,
            format: format.combine(
                format.label({ label: configs.label }),
                this.customTimestampFormat,
                this.customFormat,
            ),
            transports: [new transports.Console()],
        });
    }

    private static showColors = false;
}
