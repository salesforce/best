import { raf, time, nextTick, withMacroTask, formatTime } from './utils/timers';
import { HOOKS } from './constants';

export enum MeasureType {
    Execute = "execute",
    Before = "before",
    After = "after"
}

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

function startMeasure(markName: string, type: MeasureType) {
    performance.mark(`BEST/${type}/${markName}`);
}

function endMeasure(markName: string, type: MeasureType) {
    const eventName = `BEST/${type}/${markName}`
    performance.measure(eventName, eventName);
    performance.clearMarks(eventName);
    performance.clearMeasures(eventName);
}

const executeBenchmark = async (benchmarkNode: RuntimeNodeRunner, markName: string, { useMacroTaskAfterBenchmark }: { useMacroTaskAfterBenchmark: boolean } ) => {
    // Force garbage collection before executing an iteration (--js-flags=--expose-gc)
    _forceGC();
    return new Promise((resolve, reject) => {
        raf(async () => {
            benchmarkNode.startedAt = formatTime(time());

            startMeasure(markName, MeasureType.Execute);

            try {
                await benchmarkNode.fn();
                benchmarkNode.metrics.script = formatTime(time() - benchmarkNode.startedAt);

                if (useMacroTaskAfterBenchmark) {
                    withMacroTask(async () => {
                        await nextTick();
                        benchmarkNode.aggregate = formatTime(time() - benchmarkNode.startedAt);
                        endMeasure(markName, MeasureType.Execute);
                        resolve();
                    })();
                } else {
                    benchmarkNode.aggregate = formatTime(time() - benchmarkNode.startedAt);
                    endMeasure(markName, MeasureType.Execute);
                    resolve();
                }
            } catch (e) {
                benchmarkNode.aggregate = -1;
                endMeasure(markName, MeasureType.Execute);
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
            startMeasure(markName, MeasureType.Before);
        }
        for (const hook of hookHandlers[HOOKS.BEFORE]) {
            await hook();
        }
        if (process.env.NODE_ENV !== 'production') {
            endMeasure(markName, MeasureType.Before);
        }

        // -- Run ----
        node.startedAt = formatTime(time());
        await executeBenchmark(run, markName, opts);
        node.aggregate = formatTime(time() - node.startedAt);

        // -- After ----
        if (process.env.NODE_ENV !== 'production') {
            startMeasure(markName, MeasureType.After);
        }
        for (const hook of hookHandlers[HOOKS.AFTER]) {
            await hook();
        }
        if (process.env.NODE_ENV !== 'production') {
            endMeasure(markName, MeasureType.After);
        }
    }

    // -- After All ----
    for (const hook of hookHandlers[HOOKS.AFTER_ALL]) {
        await hook();
    }

    return node;
};
