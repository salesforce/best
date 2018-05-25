import { raf, time, nextTick, withMacroTask, formatTime } from './utils/timers';
import { HOOKS } from './constants';

const _initHandlers = () =>
    Object.values(HOOKS).reduce((o, k) => {
        o[k] = [];
        return o;
    }, {});

const _initHooks = hooks =>
    hooks.reduce((m, { type, fn }) => {
        m[type].push(fn);
        return m;
    }, _initHandlers());

const _forceGC = () => window.gc && window.gc();

// Temporary fix
// TODO (dbajric): Use https://www.npmjs.com/package/console-polyfill
if (!console.timeStamp) {
    console.timeStamp = function () { };
}

const executeBenchmark = async (benchmarkNode, { useMacroTaskAfterBenchmark }) => {
    // Force garbage collection before executing an iteration (--js-flags=--expose-gc)
    _forceGC();
    return new Promise((resolve, reject) => {
        raf(async () => {
            benchmarkNode.startedAt = formatTime(time());

            if (process.env.NODE_ENV !== 'production') {
                console.timeStamp('iteration_start');
            }

            try {
                await benchmarkNode.fn();
                benchmarkNode.runDuration = formatTime(time() - benchmarkNode.startedAt);

                if (useMacroTaskAfterBenchmark) {
                    withMacroTask(async () => {
                        await nextTick();
                        benchmarkNode.duration = formatTime(time() - benchmarkNode.startedAt);
                        if (process.env.NODE_ENV !== 'production') {
                            console.timeStamp('iteration_end');
                        }
                        resolve();
                    })();
                } else {
                    benchmarkNode.duration = formatTime(time() - benchmarkNode.startedAt);
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
        node.startedAt = formatTime(time());
        await runBenchmarkIteration(child, opts);
        node.duration = formatTime(time() - node.startedAt);

        // -- After Each Child ----
        for (const hook of hookHandlers[HOOKS.AFTER_EACH]) {
            await hook();
        }
    }

    if (run) {
        // -- Before ----
        if (process.env.NODE_ENV !== 'production') {
            console.timeStamp('before_hooks_start');
        }
        for (const hook of hookHandlers[HOOKS.BEFORE]) {
            await hook();
        }
        if (process.env.NODE_ENV !== 'production') {
            console.timeStamp('before_hooks_end');
        }

        if (process.env.NODE_ENV !== 'production') {
            console.timeStamp('iteration_start');
        }

        // -- Run ----
        node.startedAt = formatTime(time());
        await executeBenchmark(run, opts);
        node.duration = formatTime(time() - node.startedAt);

        // -- After ----
        if (process.env.NODE_ENV !== 'production') {
            console.timeStamp('after_hooks_start');
        }
        for (const hook of hookHandlers[HOOKS.AFTER]) {
            await hook();
        }
        if (process.env.NODE_ENV !== 'production') {
            console.timeStamp('after_hooks_end');
        }
    }

    // -- After All ----
    for (const hook of hookHandlers[HOOKS.AFTER_ALL]) {
        await hook();
    }

    return node;
};
