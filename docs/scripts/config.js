const fs = require('fs');
const path = require('path');
const SITE_CONFIG = require('../config');

const SRC_DIR = path.resolve(__dirname, '../src/client');
const DIST_DIR = path.resolve(__dirname, '../dist');
const DOCS_DIR = path.resolve(__dirname, '../content/docs');
const TUTORIAL_DIR = path.resolve(__dirname, '../content/tutorial');
const COMMUNITY_DIR = path.resolve(__dirname, '../content/community');
const BLOG_DIR = path.resolve(__dirname, '../content/blog');
const PAGE_STYLESHEETS_PROD_DIR = path.join(DIST_DIR, '/assets/css/prod');

const PAGE_STYLESHEETS = [
    '/assets/css/normalize.css',
    '/assets/css/main.css',
    '/assets/css/docs.css',
    '/assets/css/blog.css',
    '/assets/css/prismjs/themes/prism.css',
];

const __ENV__ = process.env.NODE_ENV || 'development';
const __PROD__ = __ENV__ === 'production';

const LWC_COMPILER_CONFIG = {
    exclude: ['**/codeMirror/**'],
    resolveFromPackages: false,
    stylesheetConfig: {
        customProperties: {
            allowDefinition: true,
        },
    },
};

const LWC_VERSION = '100';
const LWC_ENGINE_PATH = require.resolve('@lwc/engine/dist/umd/es2017/engine');
const DOCS_LIST = SITE_CONFIG.docs.pages;

function getStyleSheets() {
    if (__PROD__) {
        if (fs.existsSync(PAGE_STYLESHEETS_PROD_DIR)) {
            return fs
                .readdirSync(PAGE_STYLESHEETS_PROD_DIR)
                .map(f => path.join('/assets/css/prod', f));
        } else {
            return [];
        }
    } else {
        return PAGE_STYLESHEETS;
    }
}

module.exports = {
    SRC_DIR,
    DIST_DIR,
    DOCS_DIR,
    BLOG_DIR,
    TUTORIAL_DIR,
    COMMUNITY_DIR,

    __ENV__,
    __PROD__,

    LWC_COMPILER_CONFIG,
    LWC_ENGINE_PATH,
    LWC_VERSION,
    DOCS_LIST,
    PAGE_STYLESHEETS,
    PAGE_STYLESHEETS_PROD_DIR,
    getStyleSheets,
};
