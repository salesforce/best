import socketIO, * as SocketIO from 'socket.io';
import BenchmarkJob from "./BenchmarkJob";
import ObservableQueue from "./utils/ObservableQueue";
import { AgentCategory, createAgentManager } from "./AgentManager";
import { HubApplication } from "./HubApplication";

export interface HubConfig {
    categories: AgentCategory[],
}

function createHubApplication(config: HubConfig): HubApplication {
    const incomingQueue = new ObservableQueue<BenchmarkJob>();
    const readyQueue = new ObservableQueue<BenchmarkJob>();

    const agentsManager = createAgentManager(config.categories);

    return new HubApplication(incomingQueue, readyQueue, agentsManager);
}


export function runHub(server: Express.Application, hubConfig: HubConfig) {
    const socketServer: SocketIO.Server = socketIO(server, { path: '/hub' });
    const hub: HubApplication = createHubApplication(hubConfig);

    socketServer.on('connect', hub.handleIncomingSocketConnection);
}

export default { runHub };
