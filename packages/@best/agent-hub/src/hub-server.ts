/*
 * Copyright (c) 2019, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: MIT
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/MIT
*/

import socketIO, * as SocketIO from 'socket.io';
import { Application } from "express";
import BenchmarkJob from "./BenchmarkJob";
import ObservableQueue from "./utils/ObservableQueue";
import { createAgentManager } from "./AgentManager";
import { createStatsManager } from "./StatsManager";
import { HubApplication } from "./HubApplication";
import { AgentConfig } from "./Agent";
import { configureAgentsApi } from "./agents-api";
import { attachMiddleware, serveFrontend } from '@best/agent-frontend';
import AgentLogger from '@best/agent-logger';

export interface HubConfig {
    tokenSecret: string,
    agents: AgentConfig[],
}

function createHubApplication(config: HubConfig, logger: AgentLogger): HubApplication {
    const incomingQueue = new ObservableQueue<BenchmarkJob>();
    const agentsManager = createAgentManager(config.agents, logger);

    const hub = new HubApplication(incomingQueue, agentsManager, logger);
    createStatsManager(hub, agentsManager, logger);


    return hub;
}

export function runHub(server: any, app: Application, hubConfig: HubConfig) {
    const socketServer: SocketIO.Server = socketIO(server, { path: '/best' });
    const logger = new AgentLogger();
    const hub = createHubApplication(hubConfig, logger);

    configureAgentsApi(app, hub.agentManager, logger, hubConfig.tokenSecret);
    serveFrontend(app);

    // Authentication middleware
    socketServer.use((socket, next) => {
        const token = socket.handshake.query.token || '';

        // TODO: add authentication specifically for frontend
        if (socket.handshake.query.frontend) return next();

        if (token !== hubConfig.tokenSecret) {
            return next(new Error('authentication error: invalid token.'));
        }

        next();
    });

    socketServer.on('connect', (socket) => {
        if (!socket.handshake.query.frontend) hub.handleIncomingSocketConnection(socket);
    });

    attachMiddleware(socketServer, logger);
}

export default { runHub };
