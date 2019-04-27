"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function clearLine(stream) {
    if (process.stdout.isTTY) {
        stream.write('\x1b[999D\x1b[K');
    }
}
exports.default = clearLine;
//# sourceMappingURL=clear-line.js.map