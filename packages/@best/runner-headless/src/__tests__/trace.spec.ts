/*
 * Copyright (c) 2019, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: MIT
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/MIT
 */

import os from 'os';
import fs from 'fs';
import path from 'path';
import { parseTrace, removeTrace, mergeTracedMetrics } from '../trace';
import { BenchmarkResults } from '@best/types';

const TEMP_DIR_PREFIX = 'best-test-';
function tempDir() {
    return fs.mkdtempSync(path.join(os.tmpdir(), TEMP_DIR_PREFIX));
}

describe('removeTrace', () => {
    test('does not throw when file does not exist', async () => {
        const tracePath = path.resolve(tempDir(), 'trace.json');
        await removeTrace(tracePath);
    });

    test('deletes file when it is present', async () => {
        const tracePath = path.resolve(tempDir(), 'trace.json');
        const data = JSON.stringify({ test: true });
        fs.writeFileSync(tracePath, data);
        await removeTrace(tracePath);

        const existsAfter = fs.existsSync(tracePath);
        expect(existsAfter).toBeFalsy();
    });
});

describe('mergeTracedMetrics', () => {
    test('does not alter benchmarkResults when trace metrics are empty', async () => {
        const traceMetrics = {};
        const benchmarkResults: BenchmarkResults = {
            benchmarkName: 'test',
            executedIterations: 0,
            aggregate: 0,
            results: [{ type: 'benchmark', metrics: { script: 30 }, name: 'foo', startedAt: 0, aggregate: 0 }],
        };

        const original = benchmarkResults;

        await mergeTracedMetrics(benchmarkResults, traceMetrics);
        expect(original).toEqual(benchmarkResults);
    });

    test('merges trace metrics at root level', async () => {
        const traceMetrics = { foo: { paint: 5 } };

        const benchmarkResults: BenchmarkResults = {
            benchmarkName: 'test',
            executedIterations: 0,
            aggregate: 0,
            results: [{ type: 'benchmark', metrics: { script: 30 }, name: 'foo', startedAt: 0, aggregate: 0 }],
        };

        const expectedResults: BenchmarkResults = {
            benchmarkName: 'test',
            executedIterations: 0,
            aggregate: 0,
            results: [
                { type: 'benchmark', metrics: { script: 30, paint: 5 }, name: 'foo', startedAt: 0, aggregate: 0 },
            ],
        };

        await mergeTracedMetrics(benchmarkResults, traceMetrics);
        expect(expectedResults).toEqual(benchmarkResults);
    });

    test('merges trace metrics at when embedded in group', async () => {
        const traceMetrics = {
            foo: { paint: 5 },
            bar: { paint: 20, layout: 100 },
        };

        const benchmarkResults: BenchmarkResults = {
            benchmarkName: 'test',
            executedIterations: 0,
            aggregate: 0,
            results: [
                {
                    type: 'group',
                    name: 'A',
                    aggregate: 0,
                    startedAt: 0,
                    nodes: [
                        { type: 'benchmark', metrics: { script: 30 }, name: 'foo', startedAt: 0, aggregate: 0 },
                        { type: 'benchmark', metrics: { script: 10 }, name: 'bar', startedAt: 0, aggregate: 0 },
                    ],
                },
            ],
        };

        const expectedResults: BenchmarkResults = {
            benchmarkName: 'test',
            executedIterations: 0,
            aggregate: 0,
            results: [
                {
                    type: 'group',
                    name: 'A',
                    aggregate: 0,
                    startedAt: 0,
                    nodes: [
                        {
                            type: 'benchmark',
                            metrics: { script: 30, paint: 5 },
                            name: 'foo',
                            startedAt: 0,
                            aggregate: 0,
                        },
                        {
                            type: 'benchmark',
                            metrics: { script: 10, paint: 20, layout: 100 },
                            name: 'bar',
                            startedAt: 0,
                            aggregate: 0,
                        },
                    ],
                },
            ],
        };

        await mergeTracedMetrics(benchmarkResults, traceMetrics);
        expect(benchmarkResults).toEqual(expectedResults);
    });
});

describe('parseTrace', () => {
    test('throws error when given path does not exist', async () => {
        expect(parseTrace('fake-path.json')).rejects.toThrow(/no such file/);
    });

    test('parses trace-simple.json to find paints and layouts', async () => {
        const tracePath = path.resolve(__dirname, 'fixtures', 'trace-simple.json');

        const tracedMetrics = await parseTrace(tracePath);
        const expectedResults = {
            foo: { paint: 50, layout: 20 },
        };

        expect(tracedMetrics).toEqual(expectedResults);
    });

    test('parses trace-complex.json to find paints and layouts', async () => {
        const tracePath = path.resolve(__dirname, 'fixtures', 'trace-complex.json');

        const tracedMetrics = await parseTrace(tracePath);
        const expectedResults = {
            foo: { paint: 50, layout: 20 },
            bar: { paint: 50, layout: 10.5 },
        };

        expect(tracedMetrics).toEqual(expectedResults);
    });
});
