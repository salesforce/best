const path = jest.genMockFromModule('path');

function __setSep(separator) {
    path.sep = separator;
}

path.__setSep = __setSep;

module.exports = path;
