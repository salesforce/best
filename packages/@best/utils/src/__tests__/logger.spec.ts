/*
 * Copyright (c) 2019, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: MIT
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/MIT
 */

import pc from 'picocolors';
import { Logger } from './../logger';

describe('Logger', () => {
    const expectedTime: string = '5555-05-05 17:05:05.005';
    let consoleStdoutSpy: jest.SpyInstance;

    afterAll(() => {
        jest.useRealTimers();
    });

    beforeAll(() => {
        // Ensure the date is always the same.
        jest.useFakeTimers('modern');
        jest.setSystemTime(new Date(expectedTime));

        // The logger (winston) uses `console._stdout` for the console transport.
        // @ts-ignore
        consoleStdoutSpy = jest.spyOn(console._stdout, 'write').mockImplementation();
    });

    beforeEach(() => {
        // Reset eveything.
        jest.clearAllMocks();

        // Set things up so that, by default, the logger outputs the text in color.
        pc.isColorSupported = true;
        process.env.NODE_ENV = 'test';
    });

    test(`Should print the 'info' message to the stdout`, () => {
        const message = 'info info info';
        const label = 'test info';

        const logger = Logger.getLogger({ label });
        logger.info(message);

        expect(consoleStdoutSpy).toBeCalledTimes(1);
        expect(consoleStdoutSpy).toBeCalledWith(`${expectedTime} | INFO | ${label.toUpperCase()} | ${message}\n`);
    });

    test(`Should print the 'warn' message to the stdout in yellow`, async () => {
        const message = 'warn warn warn';
        const label = 'test warn';

        const logger = Logger.getLogger({ label });
        logger.warn(message);

        expect(consoleStdoutSpy).toBeCalledTimes(1);
        expect(consoleStdoutSpy).toBeCalledWith(
            `${pc.yellow(`${expectedTime} | WARN | ${label.toUpperCase()} | ${message}`)}\n`,
        );
    });

    test(`Should print the 'warn' message to the stdout but not in color when the terminal does not support colors`, () => {
        const message = 'warn warn warn';
        const label = 'test warn';

        // Pretent the terminal does not support colors.
        pc.isColorSupported = false;

        const logger = Logger.getLogger({ label });
        logger.warn(message);

        expect(consoleStdoutSpy).toBeCalledTimes(1);
        expect(consoleStdoutSpy).toBeCalledWith(`${expectedTime} | WARN | ${label.toUpperCase()} | ${message}\n`);
    });

    test(`Should print the 'warn' message to the stdout but not in color when 'process.env.NODE_ENV' is set to 'production'`, () => {
        const message = 'warn warn warn';
        const label = 'test warn';

        process.env.NODE_ENV = 'production';

        const logger = Logger.getLogger({ label });
        logger.warn(message);

        expect(consoleStdoutSpy).toBeCalledTimes(1);
        expect(consoleStdoutSpy).toBeCalledWith(`${expectedTime} | WARN | ${label.toUpperCase()} | ${message}\n`);
    });

    test(`Should print the 'error' message to the stdout in red`, () => {
        const message = 'error';
        const label = 'test error';

        const logger = Logger.getLogger({ label });
        logger.error(message);

        expect(consoleStdoutSpy).toBeCalledTimes(1);
        expect(consoleStdoutSpy).toBeCalledWith(
            `${pc.red(`${expectedTime} | ERROR | ${label.toUpperCase()} | ${message}`)}\n`,
        );
    });

    test(`Should print the 'error' stack trace to the stdout in red`, () => {
        const message = 'error';
        const label = 'test error';
        const error = new Error(message);

        const logger = Logger.getLogger({ label });
        logger.error(error);

        expect(consoleStdoutSpy).toBeCalledTimes(1);
        expect(consoleStdoutSpy).toBeCalledWith(
            `${pc.red(`${expectedTime} | ERROR | ${label.toUpperCase()} | ${error.stack}`)}\n`,
        );
    });
});
