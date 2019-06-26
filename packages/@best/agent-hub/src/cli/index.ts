import express from 'express';
import { HubConfig, runHub } from '../hub-server';
import { readFileSync } from 'fs';
const PORT = process.env.PORT || 5000;
const SSL_PFX_FILE = process.env.SSL_PFX_FILE;
const SSL_PFX_PASSPHRASE = process.env.SSL_PFX_PASSPHRASE;
const DEFAULT_CONFIG = getDefaultConfig(process.env.CONFIG);

function getDefaultConfig(configAsJSON?: string): HubConfig {
    const minimumConfig = { agents: [] };
    let resultConfig = {};

    if (configAsJSON) {
        resultConfig = JSON.parse(configAsJSON);
    }

    return Object.assign({}, minimumConfig, resultConfig);
}

export function run(config?: HubConfig) {
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

    app.get('/', (req, res) => res.send('BEST agent hub running!'));
    process.stdout.write(`Best agent hub listening in port ${PORT}... \n\n`);

    runHub(server, config ? config : DEFAULT_CONFIG);
}
