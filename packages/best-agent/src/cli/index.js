import express from 'express';
import { runAgent } from '../agent-service';
import path from 'path';
const PORT = process.env.PORT || 5000;
const SSL_ENABLED = process.env.SSL_ENABLED || false;
const SSL_PFX_FILE = process.env.SSL_PFX_FILE || path.resolve(__dirname, '../../certs/test_cert.pfx');
const SSL_PFX_PASSPHRASE = process.env.SSL_PFX_PASSPHRASE || 'p@ssw0rd';
const fs = require('fs');

export function run() {
    const app = express();
    let server;

    if (SSL_ENABLED) {
        const options = {
            pfx: fs.readFileSync(SSL_PFX_FILE),
            passphrase: SSL_PFX_PASSPHRASE
        };
        server = require('https').createServer(options, app);
    } else {
        server = require('http').createServer(app);
    }

    server.listen(PORT);

    app.get('/', (req, res) => res.send('BEST agent running!'));
    process.stdout.write(`Best agent listening in port ${PORT}... \n\n`);

    runAgent(server);
}
