// This is just an example
module.exports = function () {
    return {
        resolveId(importee, importer) {
            console.log('resolving: ', importee);
        }
    };
};
