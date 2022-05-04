/*
 * Copyright (c) 2019, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: MIT
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/MIT
 */

const path = require('path');
const fs = require('fs');

function readDoc(fileName, root) {
    return fs.readFileSync(path.resolve(root, `${fileName}.md`), 'utf8');
}

function readHtml(fileName, root) {
    return fs.readFileSync(path.resolve(root, `${fileName}.html`), 'utf8');
}

module.exports = {
    readDoc,
    readHtml,
};
