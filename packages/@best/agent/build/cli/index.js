"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const agent_service_1 = require("../agent-service");
const fs_1 = require("fs");
const PORT = process.env.PORT || 5000;
const SSL_PFX_FILE = process.env.SSL_PFX_FILE;
const SSL_PFX_PASSPHRASE = process.env.SSL_PFX_PASSPHRASE;
function run() {
    const app = express_1.default();
    let server;
    if (SSL_PFX_FILE && SSL_PFX_PASSPHRASE) {
        const options = {
            pfx: fs_1.readFileSync(SSL_PFX_FILE),
            passphrase: SSL_PFX_PASSPHRASE
        };
        server = require('https').createServer(options, app);
    }
    else {
        server = require('http').createServer(app);
    }
    server.listen(PORT);
    app.get('/', (req, res) => res.send('BEST agent running!'));
    process.stdout.write(`Best agent listening in port ${PORT}... \n\n`);
    agent_service_1.runAgent(server);
}
exports.run = run;
//# sourceMappingURL=index.js.map