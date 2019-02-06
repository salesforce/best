export function validateState(benchmarkState) {
    const {
        rootDescribeBlock,
        currentDescribeBlock,
        benchmarkDefinitionError
    } = benchmarkState;

    if (benchmarkDefinitionError) {
        return; // Nothing to do; there is already an error
    }

    if (rootDescribeBlock !== currentDescribeBlock) {
        benchmarkState.benchmarkDefinitionError = new Error('Benchmark parsing error');
    }

    if (rootDescribeBlock.children === 0) {
        benchmarkState.benchmarkDefinitionError = new Error('No benchmarks to run');
    }
}
