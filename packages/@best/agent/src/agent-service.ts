/*
 * Copyright (c) 2019, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: MIT
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/MIT
*/

import socketIO from 'socket.io';
import { AgentApp } from "./AgentApp";
import ObservableQueue from "./utils/ObservableQueue";
import BenchmarkTask from "./BenchmarkTask";
import BenchmarkRunner from "./BenchmarkRunner";
import AgentLogger from '@best/agent-logger';
import { Server } from "http";
import { AgentConfig } from './hub-registration';

function createAgent(server: Server, agentConfig: AgentConfig) {
    if (!agentConfig.runner) {
        throw new Error('An agent must have a runner attached to it');
    }

    const socketServer = socketIO(server, { path: '/best' });
    const logger = new AgentLogger('Agent ' + (process.env.PORT || 5000));
    const taskQueue = new ObservableQueue<BenchmarkTask>();
    const benchmarkRunner = new BenchmarkRunner(agentConfig.runner, logger);
    return new AgentApp(socketServer, taskQueue, benchmarkRunner, logger);
}

export { AgentApp, createAgent };
