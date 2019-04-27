export declare const BUILD_STATE: {
    QUEUED: string;
    BUILDING: string;
    DONE: string;
    ERROR: string;
};
export default class BuildStateMessager {
    _bufferStream: any[];
    _currentState: string;
    _out: any;
    _state: {
        benchmarks: any;
        buffer: string;
        clear: string;
    };
    constructor(benchmarksBundle: any, globalConfig: any, outputStream: any);
    _wrapStream(stream: any): void;
    _unwrapStream(stream: any): void;
    onBenchmarkBuildStart(benchmarkPath: string, projectName: string): void;
    onBenchmarkBuildEnd(benchmarkPath: string, projectName: string): void;
    logState(state: any): void;
    finishBuild(): void;
    _update(force?: boolean): void;
    _clear(): void;
    _write(): void;
}
