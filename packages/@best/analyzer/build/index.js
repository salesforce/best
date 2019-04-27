"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const constants_1 = require("./constants");
const stats_1 = require("./stats");
exports.compareSamples = stats_1.compare;
function computeSampleStats(arr, config) {
    const { samplesQuantileThreshold } = config;
    if (samplesQuantileThreshold < 1) {
        const q = stats_1.quantile(arr, samplesQuantileThreshold);
        arr = arr.filter(v => v <= q);
    }
    return {
        samples: arr,
        sampleSize: arr.length,
        samplesQuantileThreshold,
        mean: stats_1.mean(arr),
        median: stats_1.median(arr),
        variance: stats_1.variance(arr),
        medianAbsoluteDeviation: stats_1.medianAbsoluteDeviation(arr),
    };
}
exports.computeSampleStats = computeSampleStats;
function collectResults({ name, duration, runDuration, benchmarks }, collector) {
    let cNode = collector[name];
    if (typeof cNode !== 'object') {
        cNode = collector[name] = { duration: [], runDuration: [] };
    }
    if (duration > 0) {
        cNode.duration.push(duration);
    }
    if (runDuration !== undefined) {
        cNode.runDuration.push(runDuration);
    }
    else {
        benchmarks.forEach((node) => collectResults(node, collector));
    }
    return collector;
}
function createStructure({ benchmarks, name, runDuration }, collector) {
    if (runDuration !== undefined) {
        const newNode = collector[name];
        newNode.name = name;
        return newNode;
    }
    return {
        name,
        benchmarks: benchmarks.map((childNode) => createStructure(childNode, collector)),
    };
}
async function analyzeBenchmarks(benchmarkResults) {
    return Promise.all(benchmarkResults.map(async (benchmarkResult) => {
        const { results, environment, benchmarkName, projectConfig } = benchmarkResult;
        const structure = results[0];
        const collector = results.reduce((c, result) => collectResults(result, c), {});
        const benchmarkStats = Object.keys(collector).reduce((stats, bName) => {
            const benchmarkMetrics = collector[bName];
            stats[bName] = Object.keys(benchmarkMetrics).reduce((mc, metric) => {
                const list = benchmarkMetrics[metric];
                if (Array.isArray(list)) {
                    if (list.length) {
                        mc[metric] = computeSampleStats(benchmarkMetrics[metric], projectConfig);
                    }
                }
                else {
                    mc[metric] = benchmarkMetrics[metric];
                }
                return mc;
            }, {});
            return stats;
        }, {});
        const benchmarkStructure = createStructure(structure, benchmarkStats);
        benchmarkResult.stats = {
            version: constants_1.VERSION,
            benchmarkName,
            benchmarks: benchmarkStructure.benchmarks,
            environment,
        };
    }));
}
exports.analyzeBenchmarks = analyzeBenchmarks;
//# sourceMappingURL=index.js.map