import socketIO from 'socket.io';
import * as SocketIO from "socket.io";
import { AgentApp } from "./AgentApp";
import ObservableQueue from "./utils/ObservableQueue";
import BenchmarkTask from "./BenchmarkTask";
import BenchmarkRunner from "./BenchmarkRunner";
import { Server } from "http";

export async function runAgent(server: Server) {
    const socketServer: SocketIO.Server = socketIO(server, { path: '/best' });

    const taskQueue = new ObservableQueue<BenchmarkTask>();
    const taskRunner = new BenchmarkRunner();
    const agentApp: AgentApp = new AgentApp(taskQueue, taskRunner);

    socketServer.on('connect', (socket: SocketIO.Socket) => agentApp.handleIncomingConnection(socket));
}

export default { runAgent };
