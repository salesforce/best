const path = require('path');
const fs = require('fs');

function readDoc(fileName, root) {
    return fs.readFileSync(path.resolve(root, `${fileName}.md`), 'utf8');
}

function readHtml(fileName, root) {
    return fs.readFileSync(path.resolve(root, `${fileName}.html`), 'utf8');
}

module.exports = {
    readDoc,
    readHtml,
};
