/*
 * Copyright (c) 2022, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: MIT
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/MIT
 */

import { coalesce } from '../coalesce';

describe('coalesce', () => {
    test('returns null when values are null or undefined', () => {
        const noValues = coalesce();
        expect(noValues).toBeUndefined();

        const nullValues = coalesce(null, null, null);
        expect(nullValues).toBeUndefined();

        const undefinedValues = coalesce(undefined, undefined, undefined);
        expect(undefinedValues).toBeUndefined();

        const mixedValues = coalesce(undefined, null, undefined);
        expect(mixedValues).toBeUndefined();
    });

    test('returns first value that is not null or undefined', () => {
        const numericValue = coalesce(null, undefined, null, 123, undefined, 234, null);
        expect(numericValue).toBe(123);

        const booleanFalseValue = coalesce(null, undefined, null, false, undefined, true, null);
        expect(booleanFalseValue).toBe(false);

        const booleanTrueValue = coalesce(null, undefined, null, true, undefined, false, null);
        expect(booleanTrueValue).toBe(true);

        const obj = { x: 'abc' };
        const objectValue = coalesce(null, undefined, obj);
        expect(objectValue).toEqual(obj);
    });
});
