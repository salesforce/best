/*
 * Copyright (c) 2019, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: MIT
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/MIT
*/

import express from 'express';
import { Agent } from '../agent';
import { registerWithHub } from '../utils/config-utils';
import { serveFrontend, observeAgent } from '@best/agent-frontend';
import { getAgentConfig, getHubConfig } from './config';
import http from "http";

const PORT = process.env.PORT || 5000;

export function run() {
    const hubRegistrationConfig = getHubConfig();
    const agentConfig = getAgentConfig();

    if (!agentConfig.runner) {
        throw new Error('An agent must have a runner attached to it');
    }

    const app = express();
    serveFrontend(app);
    const server = http.createServer(app);

    const agent = new Agent(server, agentConfig);
    observeAgent(server, agent);

    server.listen(PORT);
    process.stdout.write(`Best agent listening in port ${PORT}...\n`);

    if (hubRegistrationConfig.uri) {
        registerWithHub(hubRegistrationConfig, agentConfig);
    }
}

export { Agent };
