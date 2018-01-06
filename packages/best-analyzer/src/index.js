import { SAMPLES_THREESHOLD, VERSION } from './constants';
import { mean, median, variance, medianAbsoluteDeviation, quantile, compare as compareSamples } from './stats';

function computeSampleStats(arr) {
    const q = quantile(arr, SAMPLES_THREESHOLD);
    const cleaned =  arr.filter(v => v <= q);

    return {
        samples: cleaned,
        sampleSize: cleaned.length,
        samplesQuantileThreshold: SAMPLES_THREESHOLD,
        mean: mean(cleaned),
        median: median(cleaned),
        variance: variance(cleaned),
        medianAbsoluteDeviation: medianAbsoluteDeviation(cleaned)
    };
}

function collectResults({ name, duration, runDuration, benchmarks}, collector) {
    const cNode = collector[name] || (collector[name] = { duration: [], runDuration: [] });
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

/*
app: {
 name: 'app-benchmark.js',
    benchmarks: {
        "benchmarking app": {
            "create and render": {
}
*/

function createStructure({ benchmarks, name, runDuration }, collector) {
    if (runDuration) {
        const newNode = collector[name];
        newNode.name = name;
        return newNode;
    }

    return { name, benchmarks: benchmarks.map(childNode => createStructure(childNode, collector)) };
}

export async function analyzeBenchmarks(benchmarkResults) {
    return Promise.all(benchmarkResults.map(async (benchmarkResult) => {
        const { results, environment, benchmarkName } = benchmarkResult;
        const structure = results[0];
        const collector = results.reduce((c, result) => collectResults(result, c), {});

        const benchmarkStats = Object.keys(collector).reduce((stats, bName) => {
            const benchmarkMetrics = collector[bName];
            stats[bName] = Object.keys(benchmarkMetrics).reduce((mc, metric) => {
                const list = benchmarkMetrics[metric];
                if (Array.isArray(list)) {
                    if (list.length) {
                        mc[metric] = computeSampleStats(benchmarkMetrics[metric]);
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
            environment
        };
    }));
}

export { compareSamples };
