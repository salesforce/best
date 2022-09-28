/*
 * Copyright (c) 2019, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: MIT
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/MIT
 */

import http from 'http';

import express from 'express';

import { serveFrontend, observeAgent } from '@best/agent-frontend';
import { Agent, RemoteClient } from '../agent';
import { getAgentConfig, getRemoteHubConfig } from './config';

const PORT = process.env.PORT || 5001;

export function run() {
    const hubRegistrationConfig = getRemoteHubConfig();
    const agentConfig = getAgentConfig();

    if (!agentConfig.runner) {
        throw new Error('An agent must have a runner attached to it');
    }

    if (!agentConfig.uri) {
        throw new Error('An agent must have a URI defined');
    }

    const app = express();
    serveFrontend(app);
    const server = http.createServer(app);
    const agent = new Agent(server, agentConfig, hubRegistrationConfig);
    observeAgent(server, agent);

    server.listen(PORT);
    process.stdout.write(`Best agent listening in port ${PORT}...\n`);
}

export { Agent, RemoteClient };
