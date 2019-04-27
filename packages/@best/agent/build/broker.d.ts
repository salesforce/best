export default class Broker {
    clients: WeakSet<any>;
    clientQueue: any;
    runningTask: any;
    socketServer: any;
    constructor(socketServer: any);
    isTaskRunning(): boolean;
    setupConnection(socket: any): void;
    connectedClient(client: any): void;
    disconnectedClient(client: any): void;
    runClientTask(client: any): void;
    runNextInQueue(): void;
    resetRunningTask(): void;
    status(): void;
}
