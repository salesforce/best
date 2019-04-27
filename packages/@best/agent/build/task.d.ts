/// <reference types="node" />
import EventEmitter from 'events';
export default class BenchmarkTask extends EventEmitter {
    id: number;
    state: string;
    client: any;
    constructor(client: any);
    _log(msg: string): void;
    start(): void;
    onClientDisconnected(): void;
    onClientError(err: any): void;
    onBenchmarkConfigReady(): void;
    onBenchmarksReady(): void;
    runBenchmarkTask(benchmarkConfig: any): Promise<void>;
    afterRunBenchmark(error: any, results: any): void;
}
