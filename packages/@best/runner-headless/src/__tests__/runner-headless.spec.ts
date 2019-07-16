import os from 'os';
import fs from 'fs';
import path from 'path';
import Runner from '../index';

const TEMP_DIR_PREFIX = 'best-test-';
function tempDir() {
    return fs.mkdtempSync(path.join(os.tmpdir(), TEMP_DIR_PREFIX));
}

const runner = new Runner();

const BENCHMARK_CONFIG = {
    benchmarkName: 'test',
    benchmarkEntry: path.resolve(__dirname, 'fixtures', 'test.html'),
};

const PROJECT_CONFIG = {
    benchmarkIterations: 1,
    benchmarkOutput: tempDir()
};

const GLOBAL_CONFIG = {
    gitInfo: {
        lastCommit: { hash: 'commit-hash-asdf' },
        localChanges: false,
        gitBranch: 'test',
        repo: { owner: 'salesforce', repo: 'best' }
    }
};

const MOCK_MESSAGER = {
    onBenchmarkStart() {},
    updateBenchmarkProgress() {},
    onBenchmarkEnd() {},
    onBenchmarkError() {}
};

describe('run', () => {
    test('result', async () => {
        const results = await runner.run(BENCHMARK_CONFIG, PROJECT_CONFIG, GLOBAL_CONFIG, MOCK_MESSAGER);
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
        const { results } = await runner.run(
            BENCHMARK_CONFIG,
            {
                benchmarkIterations: iterations,
                benchmarkOutput: tempDir()
            },
            GLOBAL_CONFIG,
            MOCK_MESSAGER,
        );

        expect(results).toHaveLength(iterations);
    });

    // TODO: Find a proper way to test maxDuration without make the unit tests too slow
    // test.skip('maxDuration', async () => {
    //     const results = await runner.run(BENCHMARK_CONFIG, {
    //         benchmarkMaxDuration: 20,
    //     }, GLOBAL_CONFIG, MOCK_MESSAGER);

    //     expect(results).toHaveLength(100);
    // });

    test('benchmarkMinIterations config', async () => {
        const minIterations = 3;
        const { results } = await runner.run(
            BENCHMARK_CONFIG,
            {
                benchmarkMaxDuration: -1,
                benchmarkMinIterations: minIterations,
                benchmarkOutput: tempDir()
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
            benchmarkEntry: path.resolve(__dirname, 'fixtures', 'syntax-error.html'),
        };

        return expect(runner.run(benchmarkConfig, PROJECT_CONFIG, GLOBAL_CONFIG, MOCK_MESSAGER)).rejects.toThrow(
            /Benchmark parse error/,
        );
    });

    test('runtime error', async () => {
        const benchmarkConfig = {
            benchmarkName: 'test',
            benchmarkEntry: path.resolve(__dirname, 'fixtures', 'runtime-error.html'),
        };

        return expect(runner.run(benchmarkConfig, PROJECT_CONFIG, GLOBAL_CONFIG, MOCK_MESSAGER)).rejects.toThrow(
            /I fail at runtime/,
        );
    });
});

describe('messager', () => {
    test('alls hooks are called in the proper order', async () => {
        const calls = [];
        const messager = {
            onBenchmarkStart(entry) {
                calls.push(['start', entry]);
            },
            updateBenchmarkProgress() {
                calls.push(['update']);
            },
            onBenchmarkEnd(entry) {
                calls.push(['end', entry]);
            },
        };

        await runner.run(BENCHMARK_CONFIG, PROJECT_CONFIG, GLOBAL_CONFIG, messager);

        expect(calls).toEqual([
            ['start', BENCHMARK_CONFIG.benchmarkEntry],
            ['update'],
            ['end', BENCHMARK_CONFIG.benchmarkEntry],
        ]);
    });
});
