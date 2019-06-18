import { dispatch } from './state';
import { HOOKS, RUN_BENCHMARK, MODES } from './constants';

const _dispatchDescribe = (blockName: string, blockFn: Function, mode?: string) => {
    dispatch({ blockName, mode, name: 'start_describe_definition' });
    blockFn();
    dispatch({ name: 'finish_describe_definition' });
};

const describe = (blockName: string, blockFn: Function) => _dispatchDescribe(blockName, blockFn);
describe.only = (blockName: string, blockFn: Function) => _dispatchDescribe(blockName, blockFn, MODES.ONLY);
describe.skip = (blockName: string, blockFn: Function) => _dispatchDescribe(blockName, blockFn, MODES.SKIP);

const _dispatchBenchmark = (blockName: any, blockFn: Function, mode?: string) => {
    dispatch({ blockName, mode, name: 'start_benchmark_definition' });
    blockFn();
    dispatch({ name: 'finish_benchmark_definition' });
};

const benchmark = (benchmarkName: string, fn: Function) => _dispatchBenchmark(benchmarkName, fn);
benchmark.only = (benchmarkName: string, fn: Function) => _dispatchBenchmark(benchmarkName, fn, MODES.ONLY);
benchmark.skip = (benchmarkName: string, fn: Function) => _dispatchBenchmark(benchmarkName, fn, MODES.SKIP);

const _addHook = (fn: Function, hookType: string) => dispatch({ fn, hookType, name: 'add_hook' });
const beforeAll = (fn: Function) => _addHook(fn, HOOKS.BEFORE_ALL);
const beforeEach = (fn: Function) => _addHook(fn, HOOKS.BEFORE_EACH);
const before = (fn: Function) => _addHook(fn, HOOKS.BEFORE);
const afterAll = (fn: Function) => _addHook(fn, HOOKS.AFTER_ALL);
const afterEach = (fn: Function) => _addHook(fn, HOOKS.AFTER_EACH);
const after = (fn: Function) => _addHook(fn, HOOKS.AFTER);
const run = (fn: Function) => dispatch({ fn, name: RUN_BENCHMARK });

export { describe, benchmark, beforeAll, beforeEach, before, afterAll, afterEach, after, run };
