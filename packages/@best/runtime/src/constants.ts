const BEFORE_ALL = 'beforeAll';
const BEFORE = 'before';
const AFTER_ALL = 'afterAll';
const AFTER = 'after';

const MODE_ONLY = 'only';
const MODE_SKIP = 'skip';

export const MODES = { ONLY: MODE_ONLY, SKIP: MODE_SKIP };
export const HOOKS = {
    BEFORE_ALL,
    BEFORE,
    AFTER_ALL,
    AFTER,
};
export const RUN_BENCHMARK = 'run_benchmark';

export const PRIMITIVE_NODE_TYPES: { [key:string]: NodeTypes } = {
    GROUP: "group",
    BENCHMARK: "benchmark",
    RUN: "run"
};
