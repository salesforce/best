/*
 * Copyright (c) 2019, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: MIT
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/MIT
 */

const fs = require('fs');
const path = require('path');
const cpy = require('cpy');
const mkdirp = require('mkdirp');
const crypto = require('crypto');

const {
    SRC_DIR,
    DIST_DIR,
    LWC_ENGINE_PATH,
    PAGE_STYLESHEETS,
    PAGE_STYLESHEETS_PROD_DIR,
    LWC_VERSION,
} = require('./config');
const ENGINE_FILE = `engine_v${LWC_VERSION}.js`;

function buildAndCompileStyles(dist) {
    const bundleSrc = PAGE_STYLESHEETS.reduce((str, stylesheetPath) => {
        const abs = path.join(dist, stylesheetPath);
        return (str += fs.readFileSync(abs, 'utf-8'));
    }, '');

    const hash = crypto.createHash('md5').update(bundleSrc).digest('hex');
    mkdirp.sync(PAGE_STYLESHEETS_PROD_DIR);
    fs.writeFileSync(path.join(PAGE_STYLESHEETS_PROD_DIR, `bundle.${hash}.css`), bundleSrc, 'utf-8');
}

module.exports = async function () {
    // Copy all assets
    await cpy(['**', '!images/favicon.ico'], path.join(DIST_DIR, 'assets'), {
        cwd: path.resolve(SRC_DIR, 'assets'),
        parents: true,
    });

    // Copy the `favicon.ico` in the root
    await cpy(path.resolve(SRC_DIR, 'assets/images/favicon.ico'), DIST_DIR);

    // Compile styles
    await buildAndCompileStyles(DIST_DIR);

    // Copy engine
    fs.copyFileSync(LWC_ENGINE_PATH, path.join(DIST_DIR, `assets/js/lwc/${ENGINE_FILE}`));
};
