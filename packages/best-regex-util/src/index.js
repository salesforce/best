import path from 'path';

export function escapeStrForRegex(string) {
    return string.replace(/[[\]{}()*+?.\\^$|]/g, '\\$&');
}

export function replacePathSepForRegex(string) {
    if (path.sep === '\\') {
        return string.replace(/(\/|\\(?!\.))/g, '\\\\');
    }
    return string;
}

export function escapePathForRegex(dir) {
    if (path.sep === '\\') {
        // Replace "\" with "/" so it's not escaped by escapeStrForRegex.
        // replacePathSepForRegex will convert it back.
        dir = dir.replace(/\\/g, '/');
    }
    return replacePathSepForRegex(escapeStrForRegex(dir));
}
