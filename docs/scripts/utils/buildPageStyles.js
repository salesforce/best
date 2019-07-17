const path = require('path');
const { getStyleSheets } = require('../config');

module.exports = function buildPageStyles(pageStyles = []) {
    const defaultStyles = getStyleSheets();
    const styles = defaultStyles.concat(pageStyles);
    const list = styles.map(src => `<link rel="stylesheet" href="${src}">`);
    return list.join('\n');
};
