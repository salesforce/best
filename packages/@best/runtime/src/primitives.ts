import { dispatch } from './state';
import { HOOKS, RUN_BENCHMARK, MODES } from './constants';

const _dispatchDescribe = (nodeName: string, blockFn: Function, mode?: string) => {
    dispatch({ nodeName, mode, nodeType: 'start_describe_definition' });
    blockFn();
    dispatch({ nodeName, nodeType: 'finish_describe_definition' });
};

const describe = (blockName: string, blockFn: Function) => _dispatchDescribe(blockName, blockFn);
describe.only = (blockName: string, blockFn: Function) => _dispatchDescribe(blockName, blockFn, MODES.ONLY);
describe.skip = (blockName: string, blockFn: Function) => _dispatchDescribe(blockName, blockFn, MODES.SKIP);

const _dispatchBenchmark = (nodeName: any, blockFn: Function, mode?: string) => {
    dispatch({ nodeName, mode, nodeType: 'start_benchmark_definition' });
    blockFn();
    dispatch({ nodeName, nodeType: 'finish_benchmark_definition' });
};

const benchmark = (benchmarkName: string, fn: Function) => _dispatchBenchmark(benchmarkName, fn);
benchmark.only = (benchmarkName: string, fn: Function) => _dispatchBenchmark(benchmarkName, fn, MODES.ONLY);
benchmark.skip = (benchmarkName: string, fn: Function) => _dispatchBenchmark(benchmarkName, fn, MODES.SKIP);

const _addHook = (fn: Function, hookType: string) => dispatch({ nodeName: 'hook', fn, hookType, nodeType: 'add_hook' });
const beforeAll = (fn: Function) => _addHook(fn, HOOKS.BEFORE_ALL);
const beforeEach = (fn: Function) => _addHook(fn, HOOKS.BEFORE_EACH);
const before = (fn: Function) => _addHook(fn, HOOKS.BEFORE);
const afterAll = (fn: Function) => _addHook(fn, HOOKS.AFTER_ALL);
const afterEach = (fn: Function) => _addHook(fn, HOOKS.AFTER_EACH);
const after = (fn: Function) => _addHook(fn, HOOKS.AFTER);
const run = (fn: Function) => dispatch({ nodeName: 'run', fn, nodeType: RUN_BENCHMARK });

export { describe, benchmark, beforeAll, beforeEach, before, afterAll, afterEach, after, run };
