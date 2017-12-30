export async function analyzeBenchmarks(benchmarkResults) {
    return Promise.all(benchmarkResults.map(async (benchmarkResult) => {
        const { proyectConfig, results } = benchmarkResult;
        console.log('>', JSON.stringify(results, null, '  '));
    }));
}
