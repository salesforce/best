/*
 * Copyright (c) 2019, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: MIT
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/MIT
 */

const grayMatter = require('gray-matter');

module.exports = function extractDocMetadata(rawDoc) {
    const { content, data } = grayMatter(rawDoc);
    return { content, metadata: data };
};
