declare const describe: {
    (blockName: any, blockFn: Function): void;
    only(blockName: any, blockFn: Function): void;
    skip(blockName: any, blockFn: Function): void;
};
declare const benchmark: {
    (benchmarkName: string, fn: Function): void;
    only(benchmarkName: string, fn: Function): void;
    skip(benchmarkName: string, fn: Function): void;
};
declare const beforeAll: (fn: Function) => void;
declare const beforeEach: (fn: Function) => void;
declare const before: (fn: Function) => void;
declare const afterAll: (fn: Function) => void;
declare const afterEach: (fn: Function) => void;
declare const after: (fn: Function) => void;
declare const run: (fn: Function) => void;
export { describe, benchmark, beforeAll, beforeEach, before, afterAll, afterEach, after, run };
