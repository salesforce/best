import socketIO, * as SocketIO from 'socket.io';
import { Application } from "express";
import * as jwt from 'jsonwebtoken';
import BenchmarkJob from "./BenchmarkJob";
import ObservableQueue from "./utils/ObservableQueue";
import { createAgentManager } from "./AgentManager";
import { HubApplication } from "./HubApplication";
import { AgentConfig } from "./Agent";
import { configureAgentsApi } from "./agents-api";
import { attachMiddleware } from '@best/agent-frontend';
import AgentLogger from '@best/agent-logger';

export interface HubConfig {
    tokenSecret: string,
    agents: AgentConfig[],
}

function createHubApplication(config: HubConfig, logger: AgentLogger): HubApplication {
    const incomingQueue = new ObservableQueue<BenchmarkJob>();
    const agentsManager = createAgentManager(config.agents, logger);

    return new HubApplication(incomingQueue, agentsManager, logger);
}

export function runHub(server: any, app: Application, hubConfig: HubConfig) {
    const socketServer: SocketIO.Server = socketIO(server, { path: '/best' });
    const logger = new AgentLogger();
    const hub: HubApplication = createHubApplication(hubConfig, logger);

    configureAgentsApi(app, hub.agentManager, logger, hubConfig.tokenSecret);

    // Authentication middleware
    socketServer.use((socket, next) => {
        const token = socket.handshake.query.token || '';

        // TODO: add authentication specifically for frontend
        if (socket.handshake.query.frontend) return next();

        jwt.verify(token, hubConfig.tokenSecret, (err: Error, payload: any) => {
            if (err) {
                return next(new Error('authentication error: ' + err.message));
            } else if (payload.scope !== 'client') {
                return next(new Error('authentication error: invalid token'));
            }

            next();
        });
    });

    socketServer.on('connect', (socket) => {
        if (!socket.handshake.query.frontend) hub.handleIncomingSocketConnection(socket);
    });

    attachMiddleware(socketServer, logger);
}

export default { runHub };
