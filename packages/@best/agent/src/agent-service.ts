import socketIO from 'socket.io';
import AgentBroker from './broker';
import * as SocketIO from "socket.io";
import {AgentApp} from "./AgentApp";

let BROKER: any;

export async function runAgent(server: any) {
    const socketServer: SocketIO.Server = socketIO(server, { path: '/best' });
    BROKER = new AgentBroker(socketServer);

    const agentApp: AgentApp = new AgentApp();

    socketServer.on('connect', (socket: SocketIO.Socket) => agentApp.handleIncomingConnection(socket));
}

export async function reset() {
    return BROKER.reset();
}
export async function getState() {
    return BROKER.getState();
}

export default { runAgent, reset, getState };
