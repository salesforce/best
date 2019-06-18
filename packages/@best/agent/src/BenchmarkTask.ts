import * as SocketIO from "socket.io";

export default class BenchmarkTask {
    public benchmarkName: string;
    public benchmarkSignature: string;
    public projectConfig: any;
    public globalConfig: any;
    public benchmarkEntry: any = false;
    public socketConnection: SocketIO.Socket;

    constructor({ benchmarkName, benchmarkSignature, projectConfig, globalConfig, socket }: { benchmarkName: string, benchmarkSignature: string, projectConfig: any, globalConfig: any, socket: SocketIO.Socket }) {
        this.benchmarkName = benchmarkName;
        this.benchmarkSignature = benchmarkSignature;
        this.projectConfig = projectConfig;
        this.globalConfig = globalConfig;
        this.socketConnection = socket;
    }
}
