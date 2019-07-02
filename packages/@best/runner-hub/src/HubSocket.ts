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

function getSocketConnection(host: string, options: any): Promise<SocketIOClient.Socket> {
    return new Promise<SocketIOClient.Socket>((resolve, reject) => {
        const socket: SocketIOClient.Socket = socketIO(host, options);

        socket.once('connect', () => {
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
    });
}

export class HubSocket extends EventEmitter {
    jobId: string;
    hubConnection: SocketIOClient.Socket;
    tarBundle: string = '';

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
        this.hubConnection.disconnect();
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
