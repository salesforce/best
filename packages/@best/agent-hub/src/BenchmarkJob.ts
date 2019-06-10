import * as SocketIO from "socket.io";

export default class BenchmarkJob {
    public jobId: string;
    public benchmarkName: string;
    public benchmarkSignature: string;
    public projectConfig: any;
    public globalConfig: any;
    public socketConnection: SocketIO.Socket;
    private _tarBundleInfo: string = '';

    constructor({ jobId, benchmarkName, benchmarkSignature, projectConfig, globalConfig, socket }: { jobId: string, benchmarkName: string, benchmarkSignature: string, projectConfig: any, globalConfig: any, socket: SocketIO.Socket }) {
        this.jobId = jobId;
        this.benchmarkName = benchmarkName;
        this.benchmarkSignature = benchmarkSignature;
        this.projectConfig = projectConfig;
        this.globalConfig = globalConfig;
        this.socketConnection = socket;
    }

    get tarBundle() {
        return this._tarBundleInfo;
    }

    set tarBundle(value: string) {
        this._tarBundleInfo = value;
    }

}
