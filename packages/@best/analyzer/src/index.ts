import { VERSION } from './constants';
import { quantile, mean, median, variance, medianAbsoluteDeviation, compare as compareSamples } from './stats';

function computeSampleStats(arr: number[], config: any) {
    const { samplesQuantileThreshold } = config;
    if (samplesQuantileThreshold < 1) {
        const q = quantile(arr, samplesQuantileThreshold);
        arr = arr.filter(v => v <= q);
    }
    return {
        samples: arr,
        sampleSize: arr.length,
        samplesQuantileThreshold,
        mean: mean(arr),
        median: median(arr),
        variance: variance(arr),
        medianAbsoluteDeviation: medianAbsoluteDeviation(arr),
    };
}

function collectResults({ name, duration, runDuration, benchmarks }: any, collector: any) {
    let cNode = collector[name];
    if (typeof cNode !== 'object') {
        cNode = collector[name] = { duration: [], runDuration: [] };
    }

    if (duration > 0) {
        cNode.duration.push(duration);
    }

    if (runDuration !== undefined) {
        cNode.runDuration.push(runDuration);
    } else {
        benchmarks.forEach((node: any) => collectResults(node, collector));
    }
    return collector;
}

function createStructure({ benchmarks, name, runDuration }: any, collector: any) {
    if (runDuration !== undefined) {
        const newNode = collector[name];
        newNode.name = name;
        return newNode;
    }

    return {
        name,
        benchmarks: benchmarks.map((childNode: any) => createStructure(childNode, collector)),
    };
}

export async function analyzeBenchmarks(benchmarkResults: any) {
    return Promise.all(
        benchmarkResults.map(async (benchmarkResult: any) => {
            const { results, environment, benchmarkName, projectConfig } = benchmarkResult;
            const structure = results[0];
            const collector = results.reduce((c: any, result: any) => collectResults(result, c), {});

            const benchmarkStats = Object.keys(collector).reduce((stats: any, bName) => {
                const benchmarkMetrics = collector[bName];
                stats[bName] = Object.keys(benchmarkMetrics).reduce((mc: any, metric) => {
                    const list = benchmarkMetrics[metric];
                    if (Array.isArray(list)) {
                        if (list.length) {
                            mc[metric] = computeSampleStats(benchmarkMetrics[metric], projectConfig);
                        }
                    } else {
                        mc[metric] = benchmarkMetrics[metric];
                    }
                    return mc;
                }, {});
                return stats;
            }, {});

            const benchmarkStructure = createStructure(structure, benchmarkStats);

            benchmarkResult.stats = {
                version: VERSION,
                benchmarkName,
                benchmarks: benchmarkStructure.benchmarks,
                environment,
            };
        }),
    );
}

export { compareSamples, computeSampleStats };
