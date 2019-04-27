"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const chalk_1 = __importDefault(require("chalk"));
const ERR_TEXT = chalk_1.default.reset.inverse.red.bold('  ERROR   ') + '  ';
function print(errorMsg, stack, stream = process.stdout) {
    stream.write(ERR_TEXT + errorMsg + (stack ? '\n' + stack : '') + '\n');
}
exports.print = print;
//# sourceMappingURL=messager-error.js.map