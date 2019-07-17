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
const TITLE = 'Lightning Web Components foundation - OSS Documentation';

// -- Helpers ---------------------------------------------------------------------------
function buildHomePage(template) {
    return buildPageHtml(
        template,
        {
            title: TITLE,
            navBar: buildNavBar(),
            pageClasses: 'home',
            sideBar: EMPTY_STRING,
            body: readHtml('home', SRC_DIR),
            headerStyles: buildPageStyles(),
            headerScripts: EMPTY_STRING,
        },
        { prod: __PROD__ },
    );
}

// -- API -------------------------------------------------------------------------------
module.exports = function writeHomePage() {
    const htmlContent = buildHomePage(readHtml('template', SRC_DIR));
    fs.writeFileSync(path.resolve(DIST_DIR, 'home.html'), htmlContent, 'utf-8');
};
