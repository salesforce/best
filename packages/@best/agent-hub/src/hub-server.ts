import socketIO, * as SocketIO from 'socket.io';
import BenchmarkJob from "./BenchmarkJob";
import ObservableQueue from "./utils/ObservableQueue";
import { createAgentManager } from "./AgentManager";
import { HubApplication } from "./HubApplication";
import { AgentConfig } from "./Agent";

export interface HubConfig {
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

    socketServer.on('connect', (socket) => {
        hub.handleIncomingSocketConnection(socket)
    });
}

export default { runHub };
