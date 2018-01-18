import * as path from 'path';
import { run } from '../index';

const BENCHMARK_CONFIG = {
    benchmarkName: 'test',
    benchmarkEntry: path.resolve(__dirname, 'fixtures', 'test.html'),
};

const PROJECT_CONFIG = {
    benchmarkIterations: 1,
};

const GLOBAL_CONFIG = {};

const MOCK_MESSAGER = {
    onBenchmarkStart() {},
    updateBenchmarkProgress() {},
    onBenchmarkEnd() {},
};

describe('run', () => {
    test('result', async () => {
        const results = await run(
            BENCHMARK_CONFIG,
            PROJECT_CONFIG,
            GLOBAL_CONFIG,
            MOCK_MESSAGER,
        );
        expect(results).toMatchObject({
            environment: {
                browser: expect.any(Object),
                configuration: expect.any(Object),
                hardware: expect.any(Object),
            },
            results: expect.any(Array),
        });
    });

    test('benchmarkIterations config', async () => {
        const iterations = 3;
        const { results } = await run(
            BENCHMARK_CONFIG,
            {
                benchmarkIterations: iterations,
            },
            GLOBAL_CONFIG,
            MOCK_MESSAGER,
        );

        expect(results).toHaveLength(iterations);
    });

    // TODO: Find a proper way to test maxDuration without make the unit tests too slow
    // test.skip('maxDuration', async () => {
    //     const results = await run(BENCHMARK_CONFIG, {
    //         benchmarkMaxDuration: 20,
    //     }, GLOBAL_CONFIG, MOCK_MESSAGER);

    //     expect(results).toHaveLength(100);
    // });

    test('benchmarkMinIterations config', async () => {
        const minIterations = 3;
        const { results } = await run(
            BENCHMARK_CONFIG,
            {
                benchmarkMaxDuration: -1,
                benchmarkMinIterations: minIterations,
            },
            GLOBAL_CONFIG,
            MOCK_MESSAGER,
        );

        expect(results.length).toBeGreaterThanOrEqual(minIterations);
    });
});

describe('errors', () => {
    test('syntax error', async () => {
        const benchmarkConfig = {
            benchmarkName: 'test',
            benchmarkEntry: path.resolve(
                __dirname,
                'fixtures',
                'syntax-error.html',
            ),
        };

        return expect(
            run(benchmarkConfig, PROJECT_CONFIG, GLOBAL_CONFIG, MOCK_MESSAGER),
        ).rejects.toThrow(/BEST is not defined/);
    });

    test('runtime error', async () => {
        const benchmarkConfig = {
            benchmarkName: 'test',
            benchmarkEntry: path.resolve(
                __dirname,
                'fixtures',
                'runtime-error.html',
            ),
        };

        return expect(
            run(benchmarkConfig, PROJECT_CONFIG, GLOBAL_CONFIG, MOCK_MESSAGER),
        ).rejects.toThrow(/I fail at runtime/);
    });
});

describe('messager', () => {
    test('alls hooks are called in the proper order', async () => {
        const calls = [];
        const messager = {
            onBenchmarkStart(name) {
                calls.push(['start', name]);
            },
            updateBenchmarkProgress() {
                calls.push(['update']);
            },
            onBenchmarkEnd(name) {
                calls.push(['end', name]);
            },
        };

        await run(BENCHMARK_CONFIG, PROJECT_CONFIG, GLOBAL_CONFIG, messager);

        expect(calls).toEqual([
            ['start', BENCHMARK_CONFIG.benchmarkName],
            ['update'],
            ['end', BENCHMARK_CONFIG.benchmarkName],
        ]);
    });
});
