/*
 * Copyright (c) 2019, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: MIT
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/MIT
 */

const path = require('path');
const { getStyleSheets } = require('../config');

module.exports = function buildPageStyles(pageStyles = []) {
    const defaultStyles = getStyleSheets();
    const styles = defaultStyles.concat(pageStyles);
    const list = styles.map((src) => `<link rel="stylesheet" href="${src}">`);
    return list.join('\n');
};
