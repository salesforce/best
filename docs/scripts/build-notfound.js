/*
 * Copyright (c) 2019, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: MIT
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/MIT
 */

// -- modules ---------------------------------------------------------------------------
const path = require('path');
const fs = require('fs');
const { readHtml } = require('./utils/readFile');
const { __PROD__ } = require('./config');
const buildPageHtml = require('./utils/buildPageHtml');
const buildPageStyles = require('./utils/buildPageStyles');
const buildNavBar = require('./utils/buildNavbar');

// -- Global Config ---------------------------------------------------------------------
const { SRC_DIR, DIST_DIR } = require('./config');
const EMPTY_STRING = '';
const TITLE = 'Page Not Found';

// -- Helpers ---------------------------------------------------------------------------
function buildNotFoundPage(template) {
    return buildPageHtml(
        template,
        {
            title: TITLE,
            navBar: buildNavBar(),
            pageClasses: 'home notfound',
            sideBar: EMPTY_STRING,
            body: readHtml('notfound', SRC_DIR),
            headerStyles: buildPageStyles(),
            headerScripts: EMPTY_STRING,
        },
        { prod: __PROD__ },
    );
}

// -- API -------------------------------------------------------------------------------
module.exports = function writeNotFoundPage() {
    const htmlContent = buildNotFoundPage(readHtml('template', SRC_DIR));
    fs.writeFileSync(path.resolve(DIST_DIR, 'notfound.html'), htmlContent, 'utf-8');
};
