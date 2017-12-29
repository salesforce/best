import { raf, time, nextTick, withMacroTask } from "./utils/timers";
import { HOOKS } from "./constants";

const _initHandlers = () => Object.values(HOOKS).reduce((o, k) => (o[k] = [], o), {});
const _initHooks = (hooks) => hooks.reduce((m, { type, fn }) => (m[type].push(fn), m), _initHandlers());
const _forceGC = () => (window.gc && window.gc());

const executeBenchmark = async (benchmarkNode, { useMacroTaskAfterBenchmark }) => {
    // Force garbage collection before executing an iteration (--js-flags=--expose-gc)
    _forceGC();
    return new Promise((resolve, reject) => {
        raf(async () => {
            benchmarkNode.startedAt = time();

            if (process.env.NODE_ENV !== 'production') {
                console.timeStamp('iteration_start');
            }

            try {
                await benchmarkNode.fn();
                benchmarkNode.runDuration = time() - benchmarkNode.startedAt;

                if (useMacroTaskAfterBenchmark) {
                    withMacroTask(async () => {
                        await nextTick();
                        benchmarkNode.duration = time() - benchmarkNode.startedAt;
                        if (process.env.NODE_ENV !== 'production') {
                            console.timeStamp('iteration_end');
                        }
                        resolve();
                    })();
                } else {
                    benchmarkNode.duration = time() - benchmarkNode.startedAt;
                    if (process.env.NODE_ENV !== 'production') {
                        console.timeStamp('iteration_end');
                    }
                    resolve();
                }
            } catch (e) {
                benchmarkNode.duration = -1;
                if (process.env.NODE_ENV !== 'production') {
                    console.timeStamp('iteration_end');
                }
                reject();
            }
        });
    });
};

export const runBenchmarkIteration = async (node, opts) => {
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
        node.startedAt = time();
        await runBenchmarkIteration(child, opts);
        node.duration = time() - node.startedAt;

        // -- After Each Child ----
        for (const hook of hookHandlers[HOOKS.AFTER_EACH]) {
            await hook();
        }
    }

    if (run) {
        for (const hook of hookHandlers[HOOKS.BEFORE]) {
            await hook();
        }

        node.startedAt = time();
        await executeBenchmark(run, opts);
        node.duration = time() - node.startedAt;

        for (const hook of hookHandlers[HOOKS.AFTER]) {
            await hook();
        }
    }

    // -- After All ----
    for (const hook of hookHandlers[HOOKS.AFTER_ALL]) {
        await hook();
    }

    return node;
}
