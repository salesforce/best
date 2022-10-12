/*
 * Copyright (c) 2019, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: MIT
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/MIT
 */

declare module 'cli-table3' {
    export default class Table {
        constructor(obj: any);
        push(rows: string[]): void;
    }
}
