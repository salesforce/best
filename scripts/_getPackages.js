const fs = require('fs');
const path = require('path');

const PACKAGES_DIR = path.resolve(__dirname, '../packages');
const BLACKLIST = ['best-frontend'];

// Get absolute paths of all directories under packages/*
module.exports = function getPackages() {
    return fs
        .readdirSync(PACKAGES_DIR)
        .map(file => path.resolve(PACKAGES_DIR, file))
        .filter(f => fs.lstatSync(path.resolve(f)).isDirectory())
        .filter(f => !BLACKLIST.includes(f.split('/').pop()));
};
