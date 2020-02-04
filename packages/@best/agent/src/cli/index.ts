/*
 * Copyright (c) 2019, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: MIT
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/MIT
*/

import express from 'express';
import { readFileSync } from 'fs';
import { createAgent } from '../agent-service';
import { registerWithHub } from '../hub-registration';
import { serveFrontend, observeAgent } from '@best/agent-frontend';
import { getAgentConfig, getHubConfig } from './config';

const PORT = process.env.PORT || 5000;
const SSL_PFX_FILE = process.env.SSL_PFX_FILE;
const SSL_PFX_PASSPHRASE = process.env.SSL_PFX_PASSPHRASE;

export function run() {
    const hubRegistrationConfig = getHubConfig();
    const agentConfig = getAgentConfig();

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

    const agent = createAgent(server, agentConfig);
    observeAgent(agent);

    process.stdout.write(`Best agent listening in port ${PORT}...\n`);

    if (hubRegistrationConfig.uri) {
        registerWithHub(hubRegistrationConfig, agentConfig);
    }
}
