/*
 * Copyright (c) 2019, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: MIT
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/MIT
 */

const emojiData = require('markdown-it-emoji/lib/data/full.json');

module.exports = (str) => {
    return String(str).replace(/:(.+?):/g, (placeholder, key) => emojiData[key] || placeholder);
};
