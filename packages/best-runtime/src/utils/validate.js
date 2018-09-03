export function validateState(benchmarkState) {
    const { rootDescribeBlock, currentDescribeBlock } = benchmarkState;
    if (rootDescribeBlock !== currentDescribeBlock) {
        benchmarkState.benchmarkDefinitionError = 'Benchmark parsing error';
    }

    if (rootDescribeBlock.children === 0) {
        benchmarkState.benchmarkDefinitionError = 'No benchmarks to run';
    }
}
