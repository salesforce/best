/*
 * Copyright (c) 2019, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: MIT
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/MIT
 */

function fib(n) {
    return n <= 1 ? 1 : fib(n - 1) + fib(n - 2);
}

describe('js-execution2', () => {
    benchmark('fibonacci', () => {
        run(() => {
            return fib(15);
        });
    });
});
