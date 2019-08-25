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
const parseDocument = require('./utils/parseDocument');
const parseSidebar = require('./utils/parseSidebar');
const buildPage = require('./utils/buildDocPage');
const markdown = require('./utils/markdown');

// -- Global Config ---------------------------------------------------------------------
const { DOCS_LIST, SRC_DIR, DIST_DIR, DOCS_DIR } = require('./config');
const HTML_TEMPLATE = readHtml('template', SRC_DIR);
const MD_INSTANCE = markdown();

// -- Helpers ---------------------------------------------------------------------------
async function generatePageHtml(pageDoc, sidebarData, template, opts) {
    const { docName } = pageDoc;
    const htmlContent = await buildPage(pageDoc, sidebarData, template, opts);
    fs.writeFileSync(path.resolve(DIST_DIR, `${docName}.html`), htmlContent, 'utf-8');
}

// -- API -------------------------------------------------------------------------------
module.exports = async function buildDocumentation() {
    // For every markdown document file generate a
    // page representation that holds all the metadata
    const pageDocList = DOCS_LIST.map(doc => parseDocument(doc, DOCS_DIR, MD_INSTANCE));

    // We will process each page independently
    for (const pageDocument of pageDocList) {
        const pageSidebar = parseSidebar(pageDocument, pageDocList);
        // Generate the HTML for a given page, sidebar and template
        await generatePageHtml(pageDocument, pageSidebar, HTML_TEMPLATE, {
            activeTab: 'guide',
            prefixUrl: '/guide',
        });
    }
};
