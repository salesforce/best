// -- modules ---------------------------------------------------------------------------
const path = require('path');
const fs = require('fs');
const { readHtml } = require('./utils/readFile');
const parseDocument = require('./utils/parseDocument');
const parseSidebar = require('./utils/parseSidebar');
const buildPage = require('./utils/buildDocPage');
const buildBlogPostHeader = require('./utils/buildBlogPostHeader');
const markdown = require('./utils/markdown');

// -- Global Config ---------------------------------------------------------------------
const { SRC_DIR, DIST_DIR, BLOG_DIR } = require('./config');
const HTML_TEMPLATE = readHtml('template', SRC_DIR);
const MD_INSTANCE = markdown();

// -- Helpers ---------------------------------------------------------------------------
async function generatePageHtml(pageDoc, sidebarData, template, opts) {
    const { docName } = pageDoc;
    const htmlContent = await buildPage(pageDoc, sidebarData, template, opts);
    fs.writeFileSync(path.resolve(DIST_DIR, `${docName}.html`), htmlContent, 'utf-8');
}

function createDate(str) {
    const date = Date.parse(str);
    if (isNaN(date)) {
        throw new Error('Invalid date for blog entry');
    }

    return new Date(date);
}

function sortBlogPages(a, b) {
    const timeA = createDate(a.metadata.created_at);
    const timeB = createDate(b.metadata.created_at);
    return timeA.getTime() < timeB.getTime();
}

function beforeRender(markdown, metadata) {
    return buildBlogPostHeader(metadata) + markdown;
}

async function generatePageHtml(pageDoc, sidebarData, template, opts) {
    const { docName } = pageDoc;
    const htmlContent = await buildPage(pageDoc, sidebarData, template, opts);
    fs.writeFileSync(path.resolve(DIST_DIR, `blog_${docName}.html`), htmlContent, 'utf-8');
}

// -- API -------------------------------------------------------------------------------
module.exports = async function buildDocumentation() {
    // For every markdown document file generate a
    // page representation that holds all the metadata
    const BLOG_LIST = fs.readdirSync(BLOG_DIR).map(file => path.basename(file, '.md'));
    const pageDocList = BLOG_LIST.map(doc =>
        parseDocument(doc, BLOG_DIR, MD_INSTANCE, { beforeRender }),
    ).sort(sortBlogPages);

    // We will process each page independently
    for (const pageDocument of pageDocList) {
        const pageSidebar = parseSidebar(pageDocument, pageDocList, { levels: 1 });
        // Generate the HTML for a given page, sidebar and template
        await generatePageHtml(pageDocument, pageSidebar, HTML_TEMPLATE, {
            pageClasses: 'blog content-wrapper flex-wrapper',
            activeTab: 'blog',
            prefixUrl: '/blog',
        });
    }
};
