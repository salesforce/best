/*
 * Copyright (c) 2019, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: MIT
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/MIT
 */

export default function trimPath(dirname: string, trim: number) {
    const parts = dirname.split('/');
    const first = parts.shift();
    const trimmedPath = parts.reduce((tmp: string, part) => {
        if (trim > 0) {
            trim -= part.length;
            return tmp;
        } else {
            return `${tmp}/${part}`;
        }
    }, '');

    return trim > 0 ? `...${trimmedPath}` : `${first}/...${trimmedPath}`;
}
