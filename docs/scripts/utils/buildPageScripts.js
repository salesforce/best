/*
 * Copyright (c) 2019, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: MIT
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/MIT
 */

const { LWC_VERSION } = require('../config');
const DEFAULT_SCRIPTS = [`lwc/engine_v${LWC_VERSION}.js`];

module.exports = function buildPageScripts(pageScripts) {
    const scripts = DEFAULT_SCRIPTS.concat(pageScripts);
    const list = scripts.map((src) => `<script defer src="/assets/js/${src}"></script>`);
    return list.join('\n');
};
