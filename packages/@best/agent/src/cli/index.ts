import express from 'express';
import { runAgent } from '../agent-service';
import { readFileSync } from 'fs';
const PORT = process.env.PORT || 5000;
const SSL_PFX_FILE = process.env.SSL_PFX_FILE;
const SSL_PFX_PASSPHRASE = process.env.SSL_PFX_PASSPHRASE;

export function run() {
    const app = express();
    let server;

    if (SSL_PFX_FILE && SSL_PFX_PASSPHRASE) {
        const options = {
            pfx: readFileSync(SSL_PFX_FILE),
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
