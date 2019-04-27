export declare const BUILD_STATE: {
    QUEUED: string;
    RUNNING: string;
    DONE: string;
    ERROR: string;
};
export default class RunnerMessager {
    _running: string | null | undefined;
    _out: any;
    _state: {
        benchmarks: any;
        buffer: string;
        progress?: any;
    };
    _currentState: any;
    _queued: any;
    constructor(benchmarksBundle: any, globalConfig: any, outputStream: any);
    onBenchmarkStart(benchmarkName: string, projectName: string, overrideOpts: any): void;
    updateBenchmarkProgress(state: any, opts: any): void;
    onBenchmarkEnd(benchmarkName: string, projectName: string): void;
    onBenchmarkError(benchmarkName: string, projectName: string): void;
    logState(state: any): void;
    finishRun(): void;
    _debounceUpdate(): void;
    _update(force?: boolean): void;
    _clear(): void;
    _write(): void;
}
