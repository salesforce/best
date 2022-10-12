/*
 * Copyright (c) 2019, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: MIT
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/MIT
 */

declare module '@lwc/rollup-plugin' {
    export default function lwc(): Plugin;
}

declare module 'rollup-plugin-terser' {
    export function terser(): Plugin;
}
