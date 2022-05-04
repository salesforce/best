/*
 * Copyright (c) 2019, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: MIT
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/MIT
 */

const { readDoc } = require('./readFile');
const extractDocMetadata = require('./parseDocMeta');
const extractDocHeaders = require('./parseDocHeaders');
const extractCustomElements = require('./parseCustomElements');

module.exports = function parseDocument(docName, docsDir, md, opts = {}) {
    const rawDocument = readDoc(docName, docsDir);
    const { content, metadata } = extractDocMetadata(rawDocument);
    const headers = extractDocHeaders(content, ['h2', 'h3'], md);
    const markdown = opts.beforeRender ? opts.beforeRender(content, metadata) : content;
    const components = extractCustomElements(markdown, {}, md);
    const html = md.render(markdown);

    return {
        docName,
        rawDocument,
        metadata,
        components,
        headers,
        html,
    };
};
