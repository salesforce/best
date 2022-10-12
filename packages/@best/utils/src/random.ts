/*
 * Copyright (c) 2022, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: MIT
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/MIT
 */

const ALPHANUMERIC_CHARACTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
const ALPHANUMERIC_CHARACTERS_LENGTH = ALPHANUMERIC_CHARACTERS.length;

/**
 * Creates a random alphanumeric string whose length is the number of characters specified.
 * @param length The length of the random string to create
 * @returns The random string
 */
export const randomAlphanumeric = (length: Number): string => {
    if (length < 1) {
        return '';
    }

    let randomString = '';

    for (let i = 0; i < length; i++) {
        // Note: Math.random returns a decimal value between 0 (inclusive) and 1 (exclusive).
        // Since it will never return a 1 and we are doing Math.floor here, the index will never
        // be larger than (ALPHANUMERIC_CHARACTERS_LENGTH-1)
        const index = Math.floor(Math.random() * ALPHANUMERIC_CHARACTERS_LENGTH);
        randomString += ALPHANUMERIC_CHARACTERS[index];
    }

    return randomString;
};
