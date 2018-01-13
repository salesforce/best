export function normalizeResults(benchmarkState) {
    const {
        benchmarkName,
        executedIterations,
        executedTime,
        results,
    } = benchmarkState;

    return {
        benchmarkName,
        executedIterations,
        executedTime,
        results,
    };
}
