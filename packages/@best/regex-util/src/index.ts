/*
 * Copyright (c) 2019, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: MIT
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/MIT
 */

import path from 'path';

export function escapeStrForRegex(string: string): string {
    return string.replace(/[[\]{}()*+?.\\^$|]/g, '\\$&');
}

export function replacePathSepForRegex(string: string): string {
    if (path.sep === '\\') {
        return string.replace(/(\/|\\(?!\.))/g, '\\\\');
    }
    return string;
}

export function escapePathForRegex(dir: string): string {
    if (path.sep === '\\') {
        // Replace "\" with "/" so it's not escaped by escapeStrForRegex.
        // replacePathSepForRegex will convert it back.
        dir = dir.replace(/\\/g, '/');
    }
    return replacePathSepForRegex(escapeStrForRegex(dir));
}
