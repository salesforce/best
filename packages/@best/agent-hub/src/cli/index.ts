/*
 * Copyright (c) 2019, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: MIT
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/MIT
 */

import express from 'express';
import { Hub } from '../hub';
import { serveFrontend, observeAgent } from '@best/agent-frontend';
import { getHubConfig } from './config';
import http from 'http';

const PORT = process.env.PORT || 5000;

export function run() {
    const hubConfig = getHubConfig();

    const app = express();
    const server = http.createServer(app);
    const hub = new Hub(server, hubConfig);

    app.get('/api/agents/:agentId', (req, res) => {
        const { agentId } = req.params;
        res.json(hub.getAgent(agentId));
    });

    app.get('/api/agents', (req, res) => {
        res.json(hub.getAgents());
    });

    serveFrontend(app);
    observeAgent(server, hub);

    server.listen(PORT);
    process.stdout.write(`Best Hub listening in port ${PORT}...\n`);
}

export { Hub };
