import express from 'express';
import { readFileSync } from 'fs';
import { runAgent } from '../agent-service';
import { registerWithHub, HubConfig } from '../hub-registration';
import { serveFrontend } from '@best/agent-frontend';

const PORT = process.env.PORT || 5000;
const SSL_PFX_FILE = process.env.SSL_PFX_FILE;
const SSL_PFX_PASSPHRASE = process.env.SSL_PFX_PASSPHRASE;
const hubRegistrationConfig: HubConfig = process.env.HUB_CONFIG ? JSON.parse(process.env.HUB_CONFIG) : null;

export function run() {
    const app = express();
    serveFrontend(app);
    
    const enableHttps = SSL_PFX_FILE && SSL_PFX_PASSPHRASE;
    const http = require(enableHttps ? 'https' : 'http');

    const options = {
        pfx: SSL_PFX_FILE ? readFileSync(SSL_PFX_FILE) : undefined,
        passphrase: enableHttps ? SSL_PFX_PASSPHRASE: undefined
    };

    const server = http.createServer(options, app);
    server.listen(PORT);

    // app.get('/', (req, res) => res.send('BEST agent running!'));
    process.stdout.write(`Best agent listening in port ${PORT}...\n`);

    runAgent(server);

    if (hubRegistrationConfig) {
        registerWithHub(hubRegistrationConfig);
    }
}
