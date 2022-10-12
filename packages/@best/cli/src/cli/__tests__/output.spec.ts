/*
 * Copyright (c) 2019, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: MIT
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/MIT
 */

import fs from 'fs';
import path from 'path';
import { OutputStream } from '@best/console-stream';
import Output from '../output';
import comparison from './fixtures/comparison1';
import { PassThrough } from 'stream';
import chalk from 'chalk';
import ansiRegex from 'ansi-regex';

describe('Output', () => {
    describe('compare', () => {
        test('fixtures/comparison1.js', () => {
            // disable chalk because fixture is plain text
            chalk.enabled = false;

            const stream = new PassThrough();
            const outputStream = new OutputStream(stream);

            const output = new Output({}, outputStream);
            output.compare(comparison);

            const actual = stream.read().toString().replace(ansiRegex(), '');
            const expected = fs.readFileSync(path.resolve(__dirname, 'fixtures/comparison1-table.txt'), 'utf8');

            expect(actual.trim()).toEqual(expected.trim());
        });
    });
});
