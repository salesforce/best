import SocketClient from './client';
import BenchmarkTask from './task';

export default class Broker {
    clients: WeakSet<any>;
    clientQueue: any;
    runningTask: any;
    socketServer: any;
    constructor(socketServer: any) {
        this.clients = new WeakSet();
        this.clientQueue = [];
        this.runningTask = null;
        this.socketServer = socketServer;
        socketServer.on('connect', (socket: any) => this.setupConnection(socket));
    }

    isTaskRunning() {
        return !!this.runningTask;
    }

    setupConnection(socket: any) {
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
