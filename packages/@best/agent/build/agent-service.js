"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const socket_io_1 = __importDefault(require("socket.io"));
const broker_1 = __importDefault(require("./broker"));
let BROKER;
async function runAgent(server) {
    const socketServer = socket_io_1.default(server, { path: '/best' });
    BROKER = new broker_1.default(socketServer);
}
exports.runAgent = runAgent;
async function reset() {
    return BROKER.reset();
}
exports.reset = reset;
async function getState() {
    return BROKER.getState();
}
exports.getState = getState;
exports.default = { runAgent, reset, getState };
//# sourceMappingURL=agent-service.js.map