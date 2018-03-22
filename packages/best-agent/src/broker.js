import SocketClient from './client';
import BenchmarkTask from './task';

export default class Broker {
    constructor(socketServer) {
        this.clients = new WeakMap();
        this.clientQueue = [];
        this.runningTask = null;
        this.socketServer = socketServer;
        socketServer.on('connect', socket => this.setupConnection(socket));
    }

    isTaskRunning() {
        return !!this.runningTask;
    }

    setupConnection(socket) {
        const client = new SocketClient(socket);
        this.clients.set(client);
        this.connectedClient(client);
        client.on('disconnect', (reason) => this.disconnectedClient(client, reason));
    }

    connectedClient(client) {
        if (!this.isTaskRunning()) {
            this.runClientTask(client);
        } else {
            this.clientQueue.push(client);
            client.setEnqueued({ pending: this.clientQueue.length });
        }
    }

    disconnectedClient(client) {
        this.clientQueue = this.clientQueue.filter(c => client !== c);
    }

    runClientTask(client) {
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
