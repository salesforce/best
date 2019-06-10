import crypto from "crypto";
import EventEmitter from 'events';
import socketIO from "socket.io-client";
import SocketIOFile from "./file-uploader";

function generateUUID() : string {
    return crypto.randomBytes(16).toString("hex");
}

const hubServerConnectionPool = new Map<string, SocketIOClient.Socket>();
const socketPool = new WeakMap<SocketIOClient.Socket, number>();

function getSocketConnection(host: string, options: any): Promise<SocketIOClient.Socket> {
    return new Promise<SocketIOClient.Socket>((resolve, reject) => {
        // @todo: we should also include the options here since the same host can have different connection options.
        const hubConnectionId = host;

        if (!hubServerConnectionPool.has(hubConnectionId)) {
            const socket: SocketIOClient.Socket = socketIO(host, options);

            socket.once('connect', () => {
                socketPool.set(socket, 1);
                hubServerConnectionPool.set(hubConnectionId, socket);

                resolve(socket);
            });

            // @todo: this is the place to handle major connection issues.
        } else {
            const socket: SocketIOClient.Socket = hubServerConnectionPool.get(hubConnectionId)!;

            if (socket.connected) {
                resolve(socket);
            } else {
                socket.connect();

                socket.once('connect', () => {
                    resolve(socket);
                });
            }
        }
    });
}

class HubSocket extends EventEmitter {
    private readonly jobId: string;
    private readonly hubSocket: SocketIOClient.Socket;
    private tarBundle: any;

    constructor(jobId: string, hubServerSocket : SocketIOClient.Socket) {
        super();
        this.jobId = jobId;
        this.hubSocket = hubServerSocket;

        this.initializeHubProxy();
    }

    runBenchmark({
                     benchmarkName,
                     benchmarkSignature,
                     tarBundle,
                     projectConfig,
                     globalConfig,
                 }: any) {
        this.tarBundle = tarBundle;

        this.hubSocket.connect();

        this.hubSocket.emit('benchmark_task', {
            jobId: this.jobId,
            benchmarkName,
            benchmarkSignature,
            projectConfig,
            globalConfig,
        });
    }

    disconnect() {
        const numberOfClientsOnSocket = socketPool.get(this.hubSocket) || 1;

        if (numberOfClientsOnSocket === 1) {
            // disconnect the socket;
            this.hubSocket.disconnect();
        }

        socketPool.set(this.hubSocket, numberOfClientsOnSocket - 1);
    }

    initializeHubProxy() {
        this.hubSocket.on('load_benchmark', (jobId: string) => {
            if (jobId === this.jobId) {
                console.log('starting upload.');
                const uploader = new SocketIOFile(this.hubSocket);
                uploader.on('ready', () => {
                    uploader.upload(this.tarBundle, { data: { jobId }});
                });

                uploader.on('error', (err) => {
                    this.emit('error', err);
                });
            }
        });

        this.hubSocket.on('running_benchmark_start', (jobId: string, benchName: any, projectName: any) => {
            if (jobId === this.jobId) {
                this.emit('running_benchmark_start', benchName, projectName);
            }
        });

        this.hubSocket.on('running_benchmark_update', (jobId: string, { state, opts }: any) => {
            if (jobId === this.jobId) {
                this.emit('running_benchmark_update', { state, opts });
            }
        });

        this.hubSocket.on('running_benchmark_end', (jobId: string, benchName: string, projectName: string) => {
            if (jobId === this.jobId) {
                this.emit('running_benchmark_end', benchName, projectName);
            }
        });

        this.hubSocket.on('benchmark_enqueued', (jobId: string, { pending }: any) => {
            if (jobId === this.jobId) {
                this.emit('benchmark_enqueued', pending);
            }
        });

        this.hubSocket.on('disconnect', (reason: any) => {
            // @todo: what should we do in this case?
            // destroy the socket or wait for it to restart?
            this.emit('disconnect', reason);
        });

        this.hubSocket.on('error', (err: any) => {
            this.emit('error', err);
        });

        this.hubSocket.on('benchmark_error', (err: any) => {
            this.emit('error', err);
        });

        this.hubSocket.on('benchmark_results', (jobId: string, { results, environment }: any) => {
            if (jobId === this.jobId) {
                this.emit('benchmark_results', { results, environment });
            }
        });
    }
}


export async function createHubSocket(host: string, options: any): Promise<HubSocket> {
    const jobId = generateUUID();

    if (!host) {
        throw new Error("Unable to create Socket connection to the Hub server, provided Host is invalid");
    }

    const connectionSocket: SocketIOClient.Socket = await getSocketConnection(host, options);

    return new HubSocket(jobId, connectionSocket);
}
