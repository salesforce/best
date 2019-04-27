"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const chalk_1 = __importDefault(require("chalk"));
const utils_1 = require("@best/utils");
function print(message, stream) {
    if (utils_1.isInteractive) {
        stream.write(chalk_1.default.bold.dim(message));
    }
}
exports.print = print;
function clear(stream) {
    if (utils_1.isInteractive) {
        utils_1.clearLine(stream);
    }
}
exports.clear = clear;
//# sourceMappingURL=messager-pre-run.js.map