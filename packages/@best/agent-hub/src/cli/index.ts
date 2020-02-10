/*
 * Copyright (c) 2019, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: MIT
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/MIT
*/

import express from 'express';
import { Hub } from '../hub';
import { serveFrontend, observeAgent } from '@best/agent-frontend';
import {  getHubConfig } from './config';
import http from "http";

const PORT = process.env.PORT || 5000;

export function run() {
    const hubConfig = getHubConfig();

    const app = express();
    serveFrontend(app);
    const server = http.createServer(app);
    const agent = new Hub(server, hubConfig);
    observeAgent(server, agent);

    server.listen(PORT);
    process.stdout.write(`Best agent listening in port ${PORT}...\n`);
}

export { Hub };
