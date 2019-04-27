/// <reference types="node" />
import EventEmitter from 'events';
declare class SocketClient extends EventEmitter {
    socket: any;
    state: string;
    benchmarkConfig: any;
    _timeout: any;
    static DISCONNECTED: string;
    static CONFIG_READY: any;
    static BENCHMARK_READY: any;
    constructor(socket: any);
    _log(msg: string): void;
    setTimeout(t: number): void;
    getBenchmarkConfig(): any;
    setState(state: any): void;
    disconnectClient(forcedError?: any): void;
    onBenchmarkTaskReceived(benchmarkConfig: any): void;
    hasBenchmarkConfig(): boolean;
    onLoadedBenchmarks({ uploadDir }: any): void;
    onUploaderError(data: any): void;
    loadBenchmarks(): void;
    setEnqueued(status: any): void;
    setRunning(): void;
    sendBenchmarkResults(err: any, benchmarkResults: any): void;
    getMessager(): {
        onBenchmarkStart(benchmarkName: string, projectName: string): void;
        updateBenchmarkProgress(state: any, opts: any): void;
        onBenchmarkEnd(benchmarkName: string, projectName: string): void;
        onBenchmarkError(benchmarkName: string, projectName: string): void;
    };
}
export default SocketClient;
