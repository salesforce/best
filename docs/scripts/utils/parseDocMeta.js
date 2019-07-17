const grayMatter = require('gray-matter');

module.exports = function extractDocMetadata(rawDoc) {
    const { content, data } = grayMatter(rawDoc);
    return { content, metadata: data };
};
