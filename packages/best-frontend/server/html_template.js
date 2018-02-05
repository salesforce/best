/* eslint-env node */
const fs = require('fs');
const path = require('path');
const HTML_TEMPLATE = fs.readFileSync(path.join(__dirname, '../', 'public/index.html'), 'utf8');

// poor-man's template system, trivial enough for now
module.exports.generateHTML = function (config, { jsPreload } = {}) {
    const jsBody = `window.BEST = ${JSON.stringify(config)}`;
    const jsPreloads = jsPreload ? jsPreload.reduce((str, p) =>
        str + `<link rel="preload" href="${p}" as="script">\n`,
    '') : '';

    return HTML_TEMPLATE
        .replace('{JS_BODY}', jsBody)
        .replace('{JS_PRELOAD}', jsPreloads);
};
