import { PassThrough } from 'stream';

const MSG = 'I am a message';

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

        const { preRunMessager } = require('../index');
        const stream = new PassThrough();

        preRunMessager.clear(stream);
        expect(clearLine).toHaveBeenCalledWith(stream);
    });

    test('print', () => {
        jest.doMock('@best/utils', () => {
            return {
                isInteractive: true,
            };
        });

        const { preRunMessager } = require('../index');
        const stream = new PassThrough();

        preRunMessager.print(MSG, stream);
        expect(stream.read().toString()).toMatch(MSG);
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

        const { preRunMessager } = require('../index');
        const stream = new PassThrough();

        preRunMessager.clear(stream);
        expect(clearLine).not.toHaveBeenCalled();
    });

    test('print', () => {
        jest.doMock('@best/utils', () => {
            return {
                isInteractive: false,
            };
        });

        const { preRunMessager } = require('../index');
        const stream = new PassThrough();

        preRunMessager.print(MSG, stream);
        expect(stream.read()).toBe(null);
    });
});
