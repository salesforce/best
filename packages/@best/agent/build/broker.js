"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = __importDefault(require("./client"));
const task_1 = __importDefault(require("./task"));
class Broker {
    constructor(socketServer) {
        this.clients = new WeakSet();
        this.clientQueue = [];
        this.runningTask = null;
        this.socketServer = socketServer;
        socketServer.on('connect', (socket) => this.setupConnection(socket));
    }
    isTaskRunning() {
        return !!this.runningTask;
    }
    setupConnection(socket) {
        const client = new client_1.default(socket);
        this.clients.add(client);
        this.connectedClient(client);
        client.on('disconnect', (reason) => this.disconnectedClient(client));
    }
    connectedClient(client) {
        if (!this.isTaskRunning()) {
            this.runClientTask(client);
        }
        else {
            this.clientQueue.push(client);
            client.setEnqueued({ pending: this.clientQueue.length });
        }
    }
    disconnectedClient(client) {
        this.clientQueue = this.clientQueue.filter((c) => client !== c);
    }
    runClientTask(client) {
        const task = new task_1.default(client);
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
    status() { }
}
exports.default = Broker;
//# sourceMappingURL=broker.js.map