"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const path_1 = __importDefault(require("path"));
function escapeStrForRegex(string) {
    return string.replace(/[[\]{}()*+?.\\^$|]/g, '\\$&');
}
exports.escapeStrForRegex = escapeStrForRegex;
function replacePathSepForRegex(string) {
    if (path_1.default.sep === '\\') {
        return string.replace(/(\/|\\(?!\.))/g, '\\\\');
    }
    return string;
}
exports.replacePathSepForRegex = replacePathSepForRegex;
function escapePathForRegex(dir) {
    if (path_1.default.sep === '\\') {
        // Replace "\" with "/" so it's not escaped by escapeStrForRegex.
        // replacePathSepForRegex will convert it back.
        dir = dir.replace(/\\/g, '/');
    }
    return replacePathSepForRegex(escapeStrForRegex(dir));
}
exports.escapePathForRegex = escapePathForRegex;
//# sourceMappingURL=index.js.map