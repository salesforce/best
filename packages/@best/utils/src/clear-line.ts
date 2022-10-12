/*
 * Copyright (c) 2019, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: MIT
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/MIT
 */

import { Writable } from 'stream';

export default function clearLine(stream: Writable): void {
    if (process.stdout.isTTY) {
        stream.write('\x1b[999D\x1b[K');
    }
}
