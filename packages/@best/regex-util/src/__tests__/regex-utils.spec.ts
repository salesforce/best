/*
 * Copyright (c) 2019, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: MIT
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/MIT
 */

import { replacePathSepForRegex, escapeStrForRegex, escapePathForRegex } from '../index';

jest.mock('path');

describe('escapeStrForRegex', () => {
    const ESCAPED_STR = [
        ['/foo/bar', '/foo/bar'],
        ['*.js', '\\*\\.js'],
        ['b?r', 'b\\?r'],
        ['foo|bar', 'foo\\|bar'],
        ['^.*.test.js$', '\\^\\.\\*\\.test\\.js\\$'],
    ];

    for (const [actual, expected] of ESCAPED_STR) {
        test(`${actual}`, () => {
            expect(escapeStrForRegex(actual)).toBe(expected);
        });
    }
});

describe('replacePathSepFromRegex', () => {
    test('with slash separator', () => {
        require('path').__setSep('/');

        expect(replacePathSepForRegex('/foo/bar/.*.test.js')).toBe('/foo/bar/.*.test.js');
        expect(replacePathSepForRegex('\\foo\\bar\\.*.test.js')).toBe('\\foo\\bar\\.*.test.js');
    });

    test('with back-slash speparator', () => {
        require('path').__setSep('\\');

        expect(replacePathSepForRegex('/foo/bar/.*.test.js')).toBe('\\\\foo\\\\bar\\\\.*.test.js');
        expect(replacePathSepForRegex('\\foo\\bar\\.*.test.js')).toBe('\\\\foo\\\\bar\\.*.test.js');
    });
});

describe('escapePathForRegex', () => {
    test('with slash separator', () => {
        require('path').__setSep('/');

        expect(escapePathForRegex('/foo/bar/.*.test.js')).toBe('/foo/bar/\\.\\*\\.test\\.js');
        expect(escapePathForRegex('\\foo\\bar\\.*.test.js')).toBe('\\\\foo\\\\bar\\\\\\.\\*\\.test\\.js');
    });

    test('with back-slash separator', () => {
        require('path').__setSep('\\');

        expect(escapePathForRegex('/foo/bar/.*.test.js')).toBe('\\\\foo\\\\bar\\\\\\.\\\\*\\.test\\.js');
        expect(escapePathForRegex('\\foo\\bar\\.*.test.js')).toBe('\\\\foo\\\\bar\\\\\\.\\\\*\\.test\\.js');
    });
});
