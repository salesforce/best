const TMPL = {
    TITLE: '{{TITLE}}',
    PAGE_CLASSES: '{{PAGE_CLASSES}}',
    NAVBAR: '{{NAVBAR}}',
    SIDEBAR: '{{SIDEBAR}}',
    BODY: '{{BODY}}',
    HEADER_STYLES: '{{HEADER_STYLES}}',
    HEADER_SCRIPTS: '{{HEADER_SCRIPTS}}',
    BOTTOM_PH: '{{BOTTOM_RUNTIME_PLACEHOLDER}}',
};

module.exports = function buildHtmlTemplate(template, options, { prod }) {
    const { title, navBar, sideBar, body, headerStyles, headerScripts, pageClasses } = options;

    return template
        .replace(TMPL.TITLE, title)
        .replace(TMPL.PAGE_CLASSES, pageClasses)
        .replace(TMPL.NAVBAR, navBar)
        .replace(TMPL.SIDEBAR, sideBar)
        .replace(TMPL.BODY, body)
        .replace(TMPL.HEADER_STYLES, headerStyles)
        .replace(TMPL.HEADER_SCRIPTS, headerScripts)
        .replace(TMPL.BOTTOM_PH, prod ? '' : TMPL.BOTTOM_PH);
};
