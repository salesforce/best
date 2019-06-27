import socketIO, * as SocketIO from 'socket.io';
import * as jwt from 'jsonwebtoken';
import BenchmarkJob from "./BenchmarkJob";
import ObservableQueue from "./utils/ObservableQueue";
import { createAgentManager } from "./AgentManager";
import { HubApplication } from "./HubApplication";
import { AgentConfig } from "./Agent";

export interface HubConfig {
    tokenSecret: string,
    agents: AgentConfig[],
}

function createHubApplication(config: HubConfig): HubApplication {
    const incomingQueue = new ObservableQueue<BenchmarkJob>();

    const agentsManager = createAgentManager(config.agents);

    return new HubApplication(incomingQueue, agentsManager);
}


export function runHub(server: Express.Application, hubConfig: HubConfig) {
    const socketServer: SocketIO.Server = socketIO(server, { path: '/hub' });
    const hub: HubApplication = createHubApplication(hubConfig);

    // middleware
    socketServer.use((socket, next) => {
        const token = socket.handshake.query.token;

        // verify token
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
        hub.handleIncomingSocketConnection(socket)
    });
}

export default { runHub };
