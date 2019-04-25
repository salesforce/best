import { runBenchmark } from '../runner';
import { getBenckmarkState, initializeBenchmarkConfig } from '../state';

function createBenchmarkState({ beforeAll, before, after, afterAll, run }) {
    // This state was manually constructed from:
    // benchmark('basic', () => {
    //   beforeAll(() => {
    //   });
    //   before(() => {
    //   });
    //   run(() => {
    //   });
    //   after(() => {
    //   });
    //   afterAll(() => {
    //   });
    // });
    const benchmarkState = {
        benchmarkName: 'basic.benchmark',
        executedIterations: 0,
        executedTime: 0,
        hasFocusedTests: false,
        iterateOnClient: true,
        iterations: 1,
        maxDuration: 1,
        memoryAllocatedFinish: 0,
        memoryAllocatedStart: 0,
        minSampleCount: 1,
        useMacroTaskAfterBenchmark: true,
        rootDescribeBlock: {
            children: [
                {
                    children: [],
                    duration: 0,
                    errors: [],
                    hooks: [
                        {
                            fn: beforeAll,
                            type: 'beforeAll',
                        },
                        {
                            fn: before,
                            type: 'before',
                        },
                        {
                            fn: after,
                            type: 'after',
                        },
                        {
                            fn: afterAll,
                            type: 'afterAll',
                        }
                    ],
                    name: 'basic',
                    run: {
                        errors: [],
                        fn: run,
                        name: 'run_benchmark'
                    },
                    runDuration: 0
                },
            ],
            hooks: [],
            name: 'basic.benchmark'
        }
    };

    // wire up circular references
    benchmarkState.rootDescribeBlock.children.forEach(child => {
        child.parent = benchmarkState.rootDescribeBlock;
        child.run.parent = child;
    });

    benchmarkState.currentDescribeBlock = benchmarkState.rootDescribeBlock;

    return benchmarkState;
}

test('runs a basic benchmark', async () => {
    const tasks = [];

    const benchmarkState = createBenchmarkState({
        beforeAll: () => {
            tasks.push('beforeAll');
        },
        before: () => {
            tasks.push('before');
        },
        after: () => {
            tasks.push('after');
        },
        afterAll: () => {
            tasks.push('afterAll');
        },
        run: () => {
            tasks.push('run');
        }
    });

    initializeBenchmarkConfig(benchmarkState);

    await runBenchmark(getBenckmarkState());
    expect(tasks).toEqual([
        'beforeAll',
        'before',
        'run',
        'after',
        'afterAll'
    ]);
});
