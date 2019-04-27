export function normalizeResults(benchmarkState: any) {
    const { benchmarkName, executedIterations, executedTime, results } = benchmarkState;

    return {
        benchmarkName,
        executedIterations,
        executedTime,
        results,
    };
}
