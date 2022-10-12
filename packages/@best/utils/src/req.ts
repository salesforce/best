/*
 * Copyright (c) 2019, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: MIT
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/MIT
 */

/**
 * Handles default exports for both ES5 and ES6 syntax
 */
export function req(id: string) {
    const r = require(id);
    return r.default || r;
}
