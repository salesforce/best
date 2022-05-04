/*
 * Copyright (c) 2019, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: MIT
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/MIT
 */

// markdown-it plugin for wrapping <pre> ... </pre>.
//
// If your plugin was chained before preWrapper, you can add additional eleemnt directly.
// If your plugin was chained after preWrapper, you can use these slots:
//   1. <!--beforebegin-->
//   2. <!--afterbegin-->
//   3. <!--beforeend-->
//   4. <!--afterend-->

module.exports = (md) => {
    const fence = md.renderer.rules.fence;
    md.renderer.rules.fence = (...args) => {
        const [tokens, idx] = args;
        const token = tokens[idx];
        const rawCode = fence(...args);
        return (
            `<!--beforebegin--><div class="language-${token.info.trim()} extra-class">` +
            `<!--afterbegin-->${rawCode}<!--beforeend--></div><!--afterend-->`
        );
    };
};
