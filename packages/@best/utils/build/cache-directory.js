"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const os_1 = __importDefault(require("os"));
const path_1 = __importDefault(require("path"));
function cacheDirectory(dirname = 'best') {
    const { getuid } = process;
    if (getuid == null) {
        return path_1.default.join(os_1.default.tmpdir(), dirname);
    }
    // On some platforms tmpdir() is `/tmp`, causing conflicts between different
    // users and permission issues. Adding an additional subdivision by UID can
    // help.
    return path_1.default.join(os_1.default.tmpdir(), `${dirname}_${getuid.call(process).toString(36)}`);
}
exports.default = cacheDirectory;
//# sourceMappingURL=cache-directory.js.map