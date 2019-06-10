import EventEmitter from "events";
import SocketIOFile from "./file-uploader";

// @todo: make the best agent be aware of a jobId.
export default class RemoteAgent extends EventEmitter {
    private readonly agentSocket: SocketIOClient.Socket;
    private tarBundle: any;

    constructor(hubServerSocket : SocketIOClient.Socket) {
        super();
        this.agentSocket = hubServerSocket;
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
        this.agentSocket.emit('benchmark_task', {
            benchmarkName,
            benchmarkSignature,
            projectConfig,
            globalConfig,
        });
    }

    initializeHubProxy() {
        this.agentSocket.on('load_benchmark', (jobId: string) => {
            const uploader = new SocketIOFile(this.agentSocket);
            uploader.on('ready', () => {
                uploader.upload(this.tarBundle, { data: { jobId }});
            });

            uploader.on('error', (err) => {
                this.emit('error', err);
            });
        });

        this.agentSocket.on('running_benchmark_start', (benchName: any, projectName: any) => {
            this.emit('running_benchmark_start', benchName, projectName);
        });

        this.agentSocket.on('running_benchmark_update', ({ state, opts }: any) => {
            this.emit('running_benchmark_update', { state, opts });
        });

        this.agentSocket.on('running_benchmark_end', (benchName: string, projectName: string) => {
            this.emit('running_benchmark_end', benchName, projectName);
        });

        this.agentSocket.on('benchmark_enqueued', ({ pending }: any) => {
            this.emit('benchmark_enqueued', { pending });
        });

        this.agentSocket.on('disconnect', (reason: any) => {
            // @todo: what should we do in this case?
            // destroy the socket or wait for it to restart?
            this.emit('disconnect', reason);
        });

        this.agentSocket.on('error', (err: any) => {
            this.emit('error', err);
        });

        this.agentSocket.on('benchmark_error', (err: any) => {
            this.emit('error', err);
        });

        this.agentSocket.on('benchmark_results', ({ results, environment }: any) => {
            this.emit('benchmark_results', { results, environment });
        });
    }
}
