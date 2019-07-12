import socketIO from 'socket.io';
import { AgentApp } from "./AgentApp";
import ObservableQueue from "./utils/ObservableQueue";
import BenchmarkTask from "./BenchmarkTask";
import BenchmarkRunner from "./BenchmarkRunner";
import { Server } from "http";

export function runAgent(server: Server) {
    const socketServer = socketIO(server, { path: '/best' });

    const taskQueue = new ObservableQueue<BenchmarkTask>();
    const taskRunner = new BenchmarkRunner();
    const agentApp = new AgentApp(taskQueue, taskRunner);

    socketServer.on('connect', (socket: SocketIO.Socket) => agentApp.handleIncomingConnection(socket));

    return socketServer;
}

export default { runAgent };
