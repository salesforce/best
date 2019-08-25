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
import { attachMiddleware } from '@best/agent-frontend';
import { Server } from "http";

export function runAgent(server: Server) {
    const socketServer = socketIO(server, { path: '/best' });

    const logger = new AgentLogger('Agent ' + (process.env.PORT || 5000));
    const taskQueue = new ObservableQueue<BenchmarkTask>();
    const taskRunner = new BenchmarkRunner(logger);
    const agentApp = new AgentApp(taskQueue, taskRunner, logger);

    socketServer.on('connect', (socket: SocketIO.Socket) => agentApp.handleIncomingConnection(socket));

    attachMiddleware(socketServer, logger);
}

export default { runAgent };
