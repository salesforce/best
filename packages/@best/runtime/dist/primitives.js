import { dispatch } from './state';
import { HOOKS, RUN_BENCHMARK, MODES } from './constants';
const _dispatchDescribe = (blockName, blockFn, mode) => {
    dispatch({ blockName, mode, name: 'start_describe_definition' });
    blockFn();
    dispatch({ name: 'finish_describe_definition' });
};
const describe = (blockName, blockFn) => _dispatchDescribe(blockName, blockFn);
describe.only = (blockName, blockFn) => _dispatchDescribe(blockName, blockFn, MODES.ONLY);
describe.skip = (blockName, blockFn) => _dispatchDescribe(blockName, blockFn, MODES.SKIP);
const _dispatchBenchmark = (blockName, blockFn, mode) => {
    dispatch({ blockName, mode, name: 'start_benchmark_definition' });
    blockFn();
    dispatch({ name: 'finish_benchmark_definition' });
};
const benchmark = (benchmarkName, fn) => _dispatchBenchmark(benchmarkName, fn);
benchmark.only = (benchmarkName, fn) => _dispatchBenchmark(benchmarkName, fn, MODES.ONLY);
benchmark.skip = (benchmarkName, fn) => _dispatchBenchmark(benchmarkName, fn, MODES.SKIP);
const _addHook = (fn, hookType) => dispatch({ fn, hookType, name: 'add_hook' });
const beforeAll = (fn) => _addHook(fn, HOOKS.BEFORE_ALL);
const beforeEach = (fn) => _addHook(fn, HOOKS.BEFORE_EACH);
const before = (fn) => _addHook(fn, HOOKS.BEFORE);
const afterAll = (fn) => _addHook(fn, HOOKS.AFTER_ALL);
const afterEach = (fn) => _addHook(fn, HOOKS.AFTER_EACH);
const after = (fn) => _addHook(fn, HOOKS.AFTER);
const run = (fn) => dispatch({ fn, name: RUN_BENCHMARK });
export { describe, benchmark, beforeAll, beforeEach, before, afterAll, afterEach, after, run };
//# sourceMappingURL=primitives.js.map