import { raf, time, nextTick, withMacroTask, formatTime } from './utils/timers';
import { HOOKS } from './constants';

declare var window: any;

const _initHandlers = () =>
    Object.values(HOOKS).reduce((o: any, k: string) => {
        o[k] = [];
        return o;
    }, {});

const _initHooks = (hooks: RuntimeHook[]) =>
    hooks.reduce((m, { type, fn }: any) => {
        m[type].push(fn);
        return m;
    }, _initHandlers());

const _forceGC = () => window.gc && window.gc();

function startMeasure(markName: string) {
    performance.mark(markName);
}

function endMeasure(markName: string) {
    performance.measure(markName, markName);
    performance.clearMarks(markName);
    performance.clearMeasures(markName);
}

function getPaintTime() {
    const start = performance.timeOrigin;
    const paintMetrics = performance.getEntriesByType('paint');
    const firstPaint = paintMetrics.find((m: { name: string, startTime: number }) => m.name === 'first-contentful-paint');
    const firstPaintDuration = firstPaint ? firstPaint.startTime - start : -1;

    return formatTime(firstPaintDuration);
}

const executeBenchmark = async (benchmarkNode: RuntimeNodeRunner, markName: string, { useMacroTaskAfterBenchmark }: { useMacroTaskAfterBenchmark: boolean } ) => {
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
                benchmarkNode.metrics.script = formatTime(time() - benchmarkNode.startedAt);
                benchmarkNode.metrics.paint = getPaintTime();

                if (useMacroTaskAfterBenchmark) {
                    withMacroTask(async () => {
                        await nextTick();
                        benchmarkNode.aggregate = formatTime(time() - benchmarkNode.startedAt);
                        if (process.env.NODE_ENV !== 'production') {
                            endMeasure(markName);
                        }
                        resolve();
                    })();
                } else {
                    benchmarkNode.aggregate = formatTime(time() - benchmarkNode.startedAt);
                    if (process.env.NODE_ENV !== 'production') {
                        endMeasure(markName);
                    }
                    resolve();
                }
            } catch (e) {
                benchmarkNode.aggregate = -1;
                if (process.env.NODE_ENV !== 'production') {
                    endMeasure(markName);
                }
                reject();
            }
        });
    });
};

export const runBenchmarkIteration = async (node: RuntimeNode, opts: { useMacroTaskAfterBenchmark: boolean }): Promise<RuntimeNode> => {
    const { hooks, children, run } = node;
    const hookHandlers = _initHooks(hooks);

    // -- Before All ----
    for (const hook of hookHandlers[HOOKS.BEFORE_ALL]) {
        await hook();
    }

    // -- For each children ----
    if (children) {
        for (const child of children) {
            // -- Before Each ----
            for (const hook of hookHandlers[HOOKS.BEFORE_EACH]) {
                await hook();
            }

            // -- Traverse Child ----
            node.startedAt = formatTime(time());
            await runBenchmarkIteration(child, opts);
            node.aggregate = formatTime(time() - node.startedAt);

            // -- After Each Child ----
            for (const hook of hookHandlers[HOOKS.AFTER_EACH]) {
                await hook();
            }
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
        node.aggregate = formatTime(time() - node.startedAt);

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
