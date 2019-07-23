import * as SocketIO from "socket.io";
import { FrozenGlobalConfig, FrozenProjectConfig } from "@best/types";

export default class BenchmarkJob {
    public benchmarkName: string;
    public benchmarkFolder: string;
    public benchmarkSignature: string;
    public projectConfig: FrozenProjectConfig;
    public globalConfig: FrozenGlobalConfig;
    public socketConnection: SocketIO.Socket;
    private _tarBundleInfo: string = '';

    constructor(
        { benchmarkName, benchmarkFolder, benchmarkSignature, projectConfig, globalConfig, socket }:
        { benchmarkName: string, benchmarkFolder: string, benchmarkSignature: string, projectConfig: FrozenProjectConfig, globalConfig: FrozenGlobalConfig, socket: SocketIO.Socket }
    ) {
        this.benchmarkName = benchmarkName;
        this.benchmarkFolder = benchmarkFolder;
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

    get spec() {
        return this.projectConfig.benchmarkRunnerConfig.spec || {};
    }

}
