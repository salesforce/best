import { readFileSync } from 'fs';
import express from 'express';
import { HubConfig, runHub } from '../hub-server';
import { serveFrontend } from '@best/agent-frontend';

const PORT = process.env.PORT || 5000;
const SSL_PFX_FILE = process.env.SSL_PFX_FILE;
const SSL_PFX_PASSPHRASE = process.env.SSL_PFX_PASSPHRASE;
const DEFAULT_CONFIG = getDefaultConfig(
    process.env.TOKEN_SECRET || 'secret',
    process.env.CONFIG,
);

function getDefaultConfig(tokenSecret: string, configAsJSON?: string): HubConfig {
    const minimumConfig = { tokenSecret, agents: [] };
    let resultConfig = {};

    if (configAsJSON) {
        resultConfig = JSON.parse(configAsJSON);
    }

    return Object.assign({}, minimumConfig, resultConfig);
}

export function run(config?: HubConfig) {
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

    app.use(express.json());

    app.get('/', (req, res) => res.send('BEST agent hub running!'));
    process.stdout.write(`Best agent hub listening in port ${PORT}... \n\n`);

    runHub(server, app, config ? config : DEFAULT_CONFIG);
}
