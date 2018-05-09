function collectBenchmarkData(commitBenchmarks, commit, stat, collector = {}, name = '') {
    if (commitBenchmarks.benchmarks) {
        return commitBenchmarks.benchmarks.reduce((l, b) => {
            const postName = commitBenchmarks.benchmarkName || commitBenchmarks.name || '';
            return collectBenchmarkData(b, commit, stat, l, name ? `${name}:${postName}` : postName);
        }, collector);
    }

    name += ':' + commitBenchmarks.name;
    if (!collector[name]) {
        collector[name] = {};
    }

    Object.keys(commitBenchmarks).reduce((red, metric) => {
        if (metric !== 'name') {
            if (!collector[name][metric]) {
                collector[name][metric] = { commit: null, value: null };
            }
            const metricMap = collector[name][metric];
            metricMap.commit = commit;
            metricMap.value = commitBenchmarks[metric][stat];
        }

        return red;
    }, collector);

    return collector;
}

function collectBenchmarkNames(benchmarkTreeNode, list = {}, name = '') {
    if (benchmarkTreeNode.benchmarks) {
        return benchmarkTreeNode.benchmarks.reduce((l, b) => {
            const postName = benchmarkTreeNode.benchmarkName || benchmarkTreeNode.name || '';
            return collectBenchmarkNames(b, l, name ? `${name}:${postName}` : postName);
        }, list);
    }
    name += ':' + benchmarkTreeNode.name;
    list[name] = Object.keys(benchmarkTreeNode).reduce((reducer, key) => {
        if (key !== 'name') {
            reducer[key] = {};
        }
        return reducer;
    }, {});
    return list;
}

export function normalizeForTrending(commitsBenchmarks, stat = 'median') {
    if (!commitsBenchmarks) {
        return {};
    }

    // Get all benchmarks and metrics
    const allBenchmarks = commitsBenchmarks.reduce((r, c) => collectBenchmarkNames(c, r), {});

    const benchmarkTrend = Object.keys(allBenchmarks).reduce((benchCollector, benchmark) => {
        const metrics = Object.keys(allBenchmarks[benchmark]).reduce((metricCollector, k) => {
            metricCollector[k] = { metric: k, stat, commits: [], values: [] };
            return metricCollector;
        }, {});
        benchCollector[benchmark] = metrics;
        return benchCollector;
    }, {});

    return commitsBenchmarks.reduce((benchTrend, cb) => {
        const commitBenchmarks = collectBenchmarkData(cb, cb.commit, stat);
        return Object.keys(allBenchmarks).reduce((bTrend, benchmarkName) => {
            if (!commitBenchmarks[benchmarkName]) {
                commitBenchmarks[benchmarkName] = Object.keys(bTrend[benchmarkName]).reduce((collector, metric) => {
                    collector[metric] = { commit: cb.commit, value: null };
                    return collector;
                }, {});
            }

            return Object.keys(bTrend[benchmarkName]).reduce((trend, metric) => {
                const metricObj = trend[benchmarkName][metric];
                metricObj.commits.push(commitBenchmarks[benchmarkName][metric].commit);
                metricObj.values.push(commitBenchmarks[benchmarkName][metric].value);
                return trend;
            }, bTrend);
        }, benchTrend);
    }, benchmarkTrend);
}

export function normalizeForComparison(benchmarks, finalBenchmarkName) {
    const benchNameParts = finalBenchmarkName.split(':');
    let benchName;
    const benchmark = {};
    while ((benchName = benchNameParts.shift())) {
        // eslint-disable-next-line no-loop-func
        const benchmarkNode = benchmarks.find(b => b.benchmarkName === benchName || b.name === benchName);

        if (benchmarkNode.environment) {
            benchmark.environment = benchmarkNode.environment;
        }

        if (benchmarkNode.name) {
            Object.assign(benchmark, benchmarkNode);
        }

        benchmarks = benchmarkNode.benchmarks;
    }

    benchmark.name = finalBenchmarkName;
    return benchmark;
}

// export function summarizeStats(benchmarks) {
//     return benchmarks.map((bench) => {
//         if (bench.environment) {
//             bench.environment = hashEnvironment(bench.environment);
//         }

//         if (bench.benchmarks) {
//             bench.benchmarks = summarizeStats(bench.benchmarks);
//             return bench;
//         }

//         return Object.keys(bench).reduce((r, key) => {
//             const metricStats = bench[key];
//             if (typeof metricStats !== 'string') {
//                 const { median, medianAbsoluteDeviation: mad } = metricStats;
//                 r[key] = {
//                     // Bear in mind we are losing some precision with this conversion
//                     median: Math.round(median * 100) / 100,
//                     medianAbsoluteDeviation: Math.round(mad * 100) / 100
//                 };
//             } else {
//                 r[key] = metricStats;
//             }
//             return r;
//         }, {});
//     });
// }
