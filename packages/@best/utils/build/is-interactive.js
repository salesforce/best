"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const is_ci_1 = __importDefault(require("is-ci"));
console.log('>>>', is_ci_1);
const isCI = is_ci_1.default;
exports.isCI = isCI;
console.log('>>>', isCI);
const isInteractive = Boolean(process.stdout.isTTY) && !isCI;
exports.isInteractive = isInteractive;
//# sourceMappingURL=is-interactive.js.map
