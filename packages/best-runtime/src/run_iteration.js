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

const hasUserTimingApi = typeof performance !== 'undefined' && performance.mark && performance.measure;

function startMeasure(markName) {
    if (hasUserTimingApi) {
        performance.mark(markName);
    }
}

function endMeasure(markName) {
    if (hasUserTimingApi) {
        performance.measure(markName, markName);
        performance.clearMarks(markName);
        performance.clearMeasures(markName);
    }
}

const executeBenchmark = async (benchmarkNode, markName, { useMacroTaskAfterBenchmark }) => {
    // Force garbage collection before executing an iteration (--js-flags=--expose-gc)
    _forceGC();
    return new Promise((resolve, reject) => {
        raf(async () => {
            benchmarkNode.startedAt = formatTime(time());

            if (process.env.NODE_ENV !== 'production') {
                startMeasure(markName);
            }

            try {
                await benchmarkNode.fn();
                benchmarkNode.runDuration = formatTime(time() - benchmarkNode.startedAt);

                if (useMacroTaskAfterBenchmark) {
                    withMacroTask(async () => {
                        await nextTick();
                        benchmarkNode.duration = formatTime(time() - benchmarkNode.startedAt);
                        if (process.env.NODE_ENV !== 'production') {
                            endMeasure(markName);
                        }
                        resolve();
                    })();
                } else {
                    benchmarkNode.duration = formatTime(time() - benchmarkNode.startedAt);
                    if (process.env.NODE_ENV !== 'production') {
                        endMeasure(markName);
                    }
                    resolve();
                }
            } catch (e) {
                benchmarkNode.duration = -1;
                if (process.env.NODE_ENV !== 'production') {
                    endMeasure(markName);
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
        const markName = run.parent.name;
        if (process.env.NODE_ENV !== 'production') {
            startMeasure(`before_${markName}`);
        }
        for (const hook of hookHandlers[HOOKS.BEFORE]) {
            await hook();
        }
        if (process.env.NODE_ENV !== 'production') {
            endMeasure(`before_${markName}`);
        }

        // -- Run ----
        node.startedAt = formatTime(time());
        await executeBenchmark(run, markName, opts);
        node.duration = formatTime(time() - node.startedAt);

        // -- After ----
        if (process.env.NODE_ENV !== 'production') {
            startMeasure(`after_${markName}`);
        }
        for (const hook of hookHandlers[HOOKS.AFTER]) {
            await hook();
        }
        if (process.env.NODE_ENV !== 'production') {
            endMeasure(`after_${markName}`);
        }
    }

    // -- After All ----
    for (const hook of hookHandlers[HOOKS.AFTER_ALL]) {
        await hook();
    }

    return node;
};
