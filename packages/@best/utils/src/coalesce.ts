/*
 * Copyright (c) 2022, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: MIT
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/MIT
 */

/**
 * Returns the first value that is not null or undefined
 * @param values list of values to be searched
 * @returns first non-null/non-undefined value, otherwise returns undefined
 */
export const coalesce = (...values: any): any => {
    if (values === null || values === undefined) {
        return null;
    }

    for (const val of values) {
        if (val !== null && val !== undefined) {
            return val;
        }
    }
};
