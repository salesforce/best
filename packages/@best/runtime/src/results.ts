import { BenchmarkResults } from "@best/types";

export function normalizeResults(benchmarkState: BenchmarkState): BenchmarkResults {
    const { benchmarkName, executedIterations, executedTime: aggregate, results } = benchmarkState;

    return {
        benchmarkName,
        executedIterations,
        aggregate,
        results,
    };
}
