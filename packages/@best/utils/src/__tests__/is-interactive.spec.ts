/*
 * Copyright (c) 2019, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: MIT
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/MIT
*/

import { isCI, isInteractive } from '../index';

test('isCI', () => {
    expect(typeof isCI).toBe('boolean');
});

test('isInteractive', () => {
    expect(typeof isInteractive).toBe('boolean');
});
