const path = require('path');
const buildSidebar = require('./buildSidebar');
const buildWebComponents = require('./buildPageComponents');
const buildPageScripts = require('./buildPageScripts');
const buildPageStyles = require('./buildPageStyles');
const buildNavBar = require('./buildNavbar');
const buildFooter = require('./buildFooter');
const buildPageHtml = require('./buildPageHtml');
const { __PROD__, SRC_DIR } = require('../config');
const modulesDir = path.resolve(SRC_DIR, 'modules');

function buildHtml(pageDoc, sidebarData, opts) {
    const { html } = pageDoc;
    const index = sidebarData.findIndex(d => d.id === pageDoc.docName);
    const prev = sidebarData[index - 1];
    const next = sidebarData[index + 1];

    return html + buildFooter(prev, next, opts);
}

module.exports = async function buildDocPage(pageDoc, sidebarData, template, opts = {}) {
    const {
        metadata: { title },
    } = pageDoc;
    const pageScripts = await buildWebComponents(pageDoc, { modulesDir });

    return buildPageHtml(
        template,
        {
            title,
            pageClasses: opts.pageClasses || 'content-wrapper flex-wrapper',
            navBar: buildNavBar(opts),
            sideBar: buildSidebar(sidebarData, opts),
            body: buildHtml(pageDoc, sidebarData, opts),
            headerStyles: buildPageStyles(),
            headerScripts: buildPageScripts(pageScripts),
        },
        { prod: __PROD__ },
    );
};
