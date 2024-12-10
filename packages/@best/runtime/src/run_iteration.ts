/*
 * Copyright (c) 2019, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: MIT
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/MIT
 */

import { raf, time, nextTick, withMacroTask, formatTime } from './utils/timers';
import { HOOKS } from './constants';

export enum BenchmarkMeasureType {
    Execute = 'BEST/execute',
    Before = 'BEST/before',
    After = 'BEST/after',
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

function startMeasure(markName: string, type: BenchmarkMeasureType) {
    performance.mark(`${type}/${markName}`);
}

function endMeasure(markName: string, type: BenchmarkMeasureType) {
    const eventName = `${type}/${markName}`;
    performance.measure(eventName, eventName);
    performance.clearMarks(eventName);
    performance.clearMeasures(eventName);
}

const executeBenchmark = async (
    benchmarkNode: RuntimeNodeRunner,
    markName: string,
    { useMacroTaskAfterBenchmark }: { useMacroTaskAfterBenchmark: boolean },
) => {
    // Force garbage collection before executing an iteration (--js-flags=--expose-gc)
    _forceGC();
    return new Promise((resolve, reject) => {
        raf(async () => {
            benchmarkNode.startedAt = formatTime(time());

            startMeasure(markName, BenchmarkMeasureType.Execute);

            try {
                await benchmarkNode.fn();
                benchmarkNode.metrics.script = formatTime(time() - benchmarkNode.startedAt);

                if (useMacroTaskAfterBenchmark) {
                    withMacroTask(async () => {
                        await nextTick();
                        benchmarkNode.aggregate = formatTime(time() - benchmarkNode.startedAt);
                        endMeasure(markName, BenchmarkMeasureType.Execute);
                        resolve(null);
                    })();
                } else {
                    benchmarkNode.aggregate = formatTime(time() - benchmarkNode.startedAt);
                    endMeasure(markName, BenchmarkMeasureType.Execute);
                    resolve(null);
                }
            } catch (_e) {
                benchmarkNode.aggregate = -1;
                endMeasure(markName, BenchmarkMeasureType.Execute);
                reject();
            }
        });
    });
};

export const runBenchmarkIteration = async (
    node: RuntimeNode,
    opts: { useMacroTaskAfterBenchmark: boolean },
): Promise<RuntimeNode> => {
    const { hooks, children, run } = node;
    const hookHandlers = _initHooks(hooks);

    // -- Before All ----
    for (const hook of hookHandlers[HOOKS.BEFORE_ALL]) {
        await hook();
    }

    // -- For each children ----
    if (children) {
        for (const child of children) {
            // -- Traverse Child ----
            node.startedAt = formatTime(time());
            await runBenchmarkIteration(child, opts);
            node.aggregate = formatTime(time() - node.startedAt);
        }
    }

    if (run) {
        // -- Before ----
        const markName = run.parent.name;
        if (process.env.NODE_ENV !== 'production') {
            startMeasure(markName, BenchmarkMeasureType.Before);
        }
        for (const hook of hookHandlers[HOOKS.BEFORE]) {
            await hook();
        }
        if (process.env.NODE_ENV !== 'production') {
            endMeasure(markName, BenchmarkMeasureType.Before);
        }

        // -- Run ----
        node.startedAt = formatTime(time());
        await executeBenchmark(run, markName, opts);
        node.aggregate = formatTime(time() - node.startedAt);

        // -- After ----
        if (process.env.NODE_ENV !== 'production') {
            startMeasure(markName, BenchmarkMeasureType.After);
        }
        for (const hook of hookHandlers[HOOKS.AFTER]) {
            await hook();
        }
        if (process.env.NODE_ENV !== 'production') {
            endMeasure(markName, BenchmarkMeasureType.After);
        }
    }

    // -- After All ----
    for (const hook of hookHandlers[HOOKS.AFTER_ALL]) {
        await hook();
    }

    return node;
};
