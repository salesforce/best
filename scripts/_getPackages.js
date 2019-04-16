const fs = require('fs');
const path = require('path');

const PACKAGES_DIR = path.resolve(__dirname, '../packages');
const BLACKLIST = ['best-frontend'];

// Get absolute PATHs of all directories under `packages/*`.
module.exports = function getPackages() {
    return fs
        .readdirSync(PACKAGES_DIR)
        .filter(f => !BLACKLIST.includes(f))
        .map(file => path.resolve(PACKAGES_DIR, file))
        .filter(f => fs.lstatSync(path.resolve(f)).isDirectory())
};
