"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const tar_1 = require("tar");
// Matches *.tgz files.
const tarballRegExp = /\.tgz$/;
async function createTarBundle(artifactsFolder, benchmarkName) {
    return tar_1.c({
        gzip: true,
        cwd: artifactsFolder,
        noDirRecurse: true,
        filter: (p) => !tarballRegExp.test(p),
        file: path_1.default.resolve(artifactsFolder, `${benchmarkName}.tgz`),
    }, fs_1.default.readdirSync(artifactsFolder));
}
exports.createTarBundle = createTarBundle;
//# sourceMappingURL=create-tar.js.map