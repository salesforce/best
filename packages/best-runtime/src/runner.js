import { nextTick, time } from "./utils/index";
import { HOOKS, RUN_BENCHMARK } from "./constants";

const _initHandlers = () => Object.values(HOOKS).reduce((o, k) => (o[k] = [], o), {});
const _initHooks = (hooks) => hooks.reduce((m, { type, fn }) => (m[type].push(fn), m), _initHandlers());

const executeBenchmark = async (benchmarkNode) => {
    const { fn } = benchmarkNode;
    const startTime = performance.now();
    await fn();
    benchmarkNode.duration = performance.now();
};

export const runBenchmark = async (node) => {
    const { hooks, children, run } = node;
    const hookHandlers = _initHooks(hooks);

    // -- Before All ----
    for (const hook of hookHandlers[HOOKS.BEFORE_ALL]) {
        await hook();
    }

    // -- For each children ----
    for (const child of children) {

        // -- Before Each ----
        for (const hook of hookHandlers[HOOKS.BEFORE_EACH]) {
            await hook();
        }

        // -- Traverse Child ----
        await runBenchmark(child);

        // -- After Each Child ----
        for (const hook of hookHandlers[HOOKS.AFTER_EACH]) {
            await hook();
        }
    }

    if (run) {
        for (const hook of hookHandlers[HOOKS.BEFORE]) {
            await hook();
        }

        await executeBenchmark(run);

        for (const hook of hookHandlers[HOOKS.AFTER]) {
            await hook();
        }
    }

    // -- After All ----
    for (const hook of hookHandlers[HOOKS.AFTER_ALL]) {
        await hook();
    }
}
