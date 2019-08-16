/*
 * Copyright (c) 2019, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: MIT
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/MIT
*/

const markdown = require('./markdown');

// This is faster than using any plugin for iterating over the tokens
function traverseTokens(tokens, visitor) {
    tokens.forEach(t => {
        if (t.type === 'html_block' || t.type === 'html_inline') {
            const matches = t.content.match(/<(\w+-(\w+-?)+)/);
            if (matches) {
                visitor(matches[1]);
            }
        }

        if (t.children) {
            traverseTokens(t.children, visitor);
        }
    });
}

module.exports = function extractDocHeaders(rawDoc, options, md = markdown()) {
    const tokens = md.parse(rawDoc, {});
    const uniqueElementNames = new Set();
    traverseTokens(tokens, customElementName => {
        uniqueElementNames.add(customElementName);
    });

    return Array.from(uniqueElementNames);
};
