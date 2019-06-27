import crypto from "crypto";
import socketIO from "socket.io-client";
import SocketIOFile from "./file-uploader";
import { EventEmitter } from "events";
import {
    BenchmarkResultsSnapshot,
    BenchmarkResultsState,
    BenchmarkRuntimeConfig, FrozenGlobalConfig,
    FrozenProjectConfig
} from "@best/types";

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

            socket.once('connect_error', (err: any) => {
                console.log(err);
                reject(new Error('Error connecting to the hub'));
            });

            socket.once('connect_timeout', (err: any) => {
                console.log(err);
                reject(new Error('Timeout expired connecting to the hub'));
            });

            socket.once('error', (message: string) => {
                if (message && message.indexOf('authentication error') >= 0) {
                    reject(new Error('Error connecting to the hub: Invalid credentials'));
                } else {
                    console.log(message);
                    reject(new Error(message));
                }
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

                socket.once('connect_error', (err: any) => {
                    console.log(err);
                    reject(err);
                });

                socket.once('connect_timeout', (err: any) => {
                    console.log(err);
                    reject(new Error('Timeout expired connecting to the hub'));
                });

                socket.once('error', (err: any) => {
                    console.log(err);
                    reject(new Error('Timeout expired connecting to the hub'));
                });
            }
        }
    });
}

export class HubSocket extends EventEmitter {
    jobId: string;
    hubConnection: SocketIOClient.Socket;
    tarBundle: string = '';
    disconnectingSocket: boolean = false;

    constructor(jobId: string, hubServerSocket : SocketIOClient.Socket) {
        super();
        this.jobId = jobId;
        this.hubConnection = hubServerSocket;

        this.initializeHubProxy();
    }

    runBenchmark({
                     benchmarkName,
                     benchmarkSignature,
                     tarBundle,
                     projectConfig,
                     globalConfig,
                 }: {
        benchmarkName: string,
        benchmarkSignature: string,
        tarBundle: string,
        projectConfig: FrozenProjectConfig,
        globalConfig: FrozenGlobalConfig,
    }) {
        this.tarBundle = tarBundle;
        this.hubConnection.emit('benchmark_task', {
            jobId: this.jobId,
            benchmarkName,
            benchmarkSignature,
            projectConfig,
            globalConfig,
        });
    }

    disconnect() {
        // @todo: dont use globals
        const numberOfClientsOnSocket = socketPool.get(this.hubConnection) || 1;

        if (numberOfClientsOnSocket === 1) {
            // disconnect the socket;
            this.disconnectingSocket = true;
            this.hubConnection.disconnect();
        }

        socketPool.set(this.hubConnection, numberOfClientsOnSocket - 1);
    }

    initializeHubProxy() {
        this.hubConnection.on('load_benchmark', (jobId: string) => {
            if (jobId === this.jobId) {
                const uploader = new SocketIOFile(this.hubConnection);
                uploader.on('ready', () => {
                    uploader.upload(this.tarBundle, { data: { jobId }});
                });

                uploader.on('error', (err) => {
                    this.emit('benchmark_error', err);
                });
            }
        });

        this.hubConnection.on('running_benchmark_start', (jobId: string) => {
            if (jobId === this.jobId) {
                this.emit('running_benchmark_start');
            }
        });

        this.hubConnection.on('running_benchmark_update', (jobId: string, { state, opts }: { state: BenchmarkResultsState, opts: BenchmarkRuntimeConfig }) => {
            if (jobId === this.jobId) {
                this.emit('running_benchmark_update', state, opts);
            }
        });

        this.hubConnection.on('running_benchmark_end', (jobId: string) => {
            if (jobId === this.jobId) {
                this.emit('running_benchmark_end');
            }
        });

        this.hubConnection.on('benchmark_enqueued', (jobId: string, { pending }: { pending: number }) => {
            if (jobId === this.jobId) {
                this.emit('benchmark_enqueued', pending);
            }
        });

        this.hubConnection.on('disconnect', (reason: string) => {
            this.emit('disconnect', reason);
        });

        this.hubConnection.on('error', (err: any) => {
            this.emit('benchmark_error', err);
        });

        this.hubConnection.on('benchmark_error', (jobId: string, err: any) => {
            if (jobId === this.jobId) {
                this.emit('benchmark_error', err);
            }
        });

        this.hubConnection.on('benchmark_results', (jobId: string, result: BenchmarkResultsSnapshot) => {
            if (jobId === this.jobId) {
                this.emit('benchmark_results', result);
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
