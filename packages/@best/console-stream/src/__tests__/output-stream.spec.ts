import { PassThrough } from 'stream';
import { EOL } from "os";

const MSG = 'I am a message';
const MSG_EOL = 'I am a message with eol char' + EOL;

beforeEach(() => {
    jest.resetModules();
});

describe('interactive', () => {
    test('clearLine', () => {
        const clearLine = jest.fn();
        jest.doMock('@best/utils', () => {
            return {
                isInteractive: true,
                clearLine,
            };
        });

        const { OutputStream } = require('../index');
        const stream = new PassThrough();
        const outputStream = new OutputStream(stream);

        outputStream.clearLine();
        expect(clearLine).toHaveBeenCalledWith(stream);
    });

    test('write', () => {
        jest.doMock('@best/utils', () => {
            return {
                isInteractive: true,
            };
        });

        const { OutputStream } = require('../index');
        const stream = new PassThrough();
        const outputStream = new OutputStream(stream);

        outputStream.write(MSG);
        expect(stream.read().toString()).toMatch(MSG);
    });

    test('clearAll', () => {
        const clearLine = jest.fn();
        jest.doMock('@best/utils', () => {
            return { isInteractive: true, clearLine };
        });

        const { OutputStream } = require('../index');
        const stream = new PassThrough();
        const outputStream = new OutputStream(stream);

        outputStream.write(MSG_EOL);
        expect(outputStream._linesBuffer).toBe(1);
        outputStream.clearAll();
        expect(stream.read().length).toBeGreaterThan(MSG_EOL.length);
    });
});

describe('not interactive', () => {
    test('clearLine', () => {
        const clearLine = jest.fn();
        jest.doMock('@best/utils', () => {
            return {
                isInteractive: false,
                clearLine,
            };
        });

        const { OutputStream } = require('../index');
        const stream = new PassThrough();
        const outputStream = new OutputStream(stream);

        outputStream.clearLine();
        expect(clearLine).not.toHaveBeenCalled();
    });

    test('write', () => {
        jest.doMock('@best/utils', () => {
            return {
                isInteractive: false,
            };
        });

        const { OutputStream } = require('../index');
        const stream = new PassThrough();
        const outputStream = new OutputStream(stream);
        outputStream.write(MSG);
        outputStream.write(MSG);
        outputStream.clearAll();

        expect(stream.read().toString()).toBe(MSG.repeat(2));
    });
});
