import SocketClient from './client';
import BenchmarkTask from './task';
import * as SocketIO from "socket.io";

export default class Broker {
    clients: WeakSet<SocketClient>;
    clientQueue: SocketClient[];
    runningTask: BenchmarkTask | null;
    socketServer: SocketIO.Server;

    constructor(socketServer: SocketIO.Server) {
        this.clients = new WeakSet<SocketClient>();
        this.clientQueue = [];
        this.runningTask = null;
        this.socketServer = socketServer;
        socketServer.on('connect', (socket: SocketIO.Socket) => this.setupConnection(socket));
    }

    isTaskRunning() {
        return this.runningTask !== null;
    }

    setupConnection(socket: SocketIO.Socket) {
        const client = new SocketClient(socket);

        this.clients.add(client);
        this.connectedClient(client);
        client.on('disconnect', (reason) => this.disconnectedClient(client));
    }

    connectedClient(client: any) {
        if (!this.isTaskRunning()) {
            this.runClientTask(client);
        } else {
            this.clientQueue.push(client);
            client.setEnqueued({ pending: this.clientQueue.length });
        }
    }

    disconnectedClient(client: any) {
        this.clientQueue = this.clientQueue.filter((c: any) => client !== c);
    }

    runClientTask(client: any) {
        const task = new BenchmarkTask(client);
        task.on('complete', () => this.resetRunningTask());
        task.on('error', () => this.resetRunningTask());
        this.runningTask = task;
        task.start();
    }

    runNextInQueue() {
        const client = this.clientQueue.shift();
        if (client) {
            this.runClientTask(client);
        }
    }

    resetRunningTask() {
        this.runningTask = null;
        this.runNextInQueue();
    }

    status() {}
}
