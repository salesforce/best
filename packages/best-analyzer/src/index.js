import { SAMPLES_THREESHOLD } from './constants';
import { mean, median, variance, medianAbsoluteDeviation, quantile, compare } from './stats';

function isNonEmptyArray(arr) {
    return arr && Array.isArray(arr) && arr.length
}

function computeSampleStats(arr) {
    const q = quantile(arr, SAMPLES_THREESHOLD);
    const cleaned =  arr.filter(v => v <= q);

    return {
        arr: cleaned,
        mean: mean(cleaned),
        median: median(cleaned),
        variance: variance(cleaned),
        mad: medianAbsoluteDeviation(cleaned)
    }
}

function collectResults({ name, duration, runDuration, benchmarks}, collector, parent) {
    const cNode = collector[name] || (collector[name] = { duration: [], runDuration: [], parent });
    if (duration > 0) {
        cNode.duration.push(duration);
    }

    if (runDuration) {
        cNode.runDuration.push(runDuration);
    } else {
        benchmarks.forEach((node) => collectResults(node, collector, name));
    }
    return collector;
}

export async function analyzeBenchmarks(benchmarkResults) {
    return Promise.all(benchmarkResults.map(async (benchmarkResult) => {
        const { proyectConfig, results } = benchmarkResult;
        const collector = results.reduce((c, result) => collectResults(result, c), {});

        const collectedStats = Object.keys(collector).reduce((stats, benchmarkName) => {
            const benchmarkMetrics = collector[benchmarkName];
            stats[benchmarkName] = Object.keys(benchmarkMetrics).reduce((mc, metric) => {
                const list = benchmarkMetrics[metric];
                if (isNonEmptyArray(list)) {
                    mc[metric] = computeSampleStats(benchmarkMetrics[metric]);
                } else {
                    mc[metric] = benchmarkMetrics[metric];
                }
                return mc;
            }, {});
            return stats;
        }, {});

        console.log(collectedStats);

    }));
}
