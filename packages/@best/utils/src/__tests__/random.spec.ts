/*
 * Copyright (c) 2022, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: MIT
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/MIT
*/

import { randomAlphanumeric } from '../random';

describe('randomAlphanumeric', () => {
    test('returns random string whose length matches requested length', () => {
        for (let len = 0; len < 100; len ++) {
            const str = randomAlphanumeric(len);
            expect(str).toHaveLength(len);
        }
    });

    test('returns empty string when length requested is less than 1', () => {
        const str = randomAlphanumeric(0);
        expect(str).toBe('');

    });

    test('returns empty string when length parameter is negative number', () => {
        const str = randomAlphanumeric(-15);
        expect(str).toBe('');
    });
});
