import { compareSamples } from '@best/analyzer';
import { StatsResults, StatsNode, BenchmarkMetricNames, BenchmarkStats } from '@best/types';

// function compareEnvironment(/* baseEnv, targetEnv */) {
//     // TODO
// }

export type ResultComparisonTypes = "project" | "group" | "benchmark";
export interface ResultComparisonBase {
    type: ResultComparisonTypes;
    name: string;
}

export interface ResultComparisonProject extends ResultComparisonBase {
    type: "project";
    comparisons: ResultComparison[]
}

export interface ResultComparisonGroup extends ResultComparisonBase {
    type: "group";
    comparisons: ResultComparison[]
}

export interface ResultComparisonBenchmark extends ResultComparisonBase {
    type: "benchmark";
    metrics: {
        [key in BenchmarkMetricNames]?: {
            baseStats: BenchmarkStats,
            targetStats: BenchmarkStats
            samplesComparison: 0 | 1 | -1
        }
    }
}

export type ResultComparison = ResultComparisonProject | ResultComparisonGroup | ResultComparisonBenchmark;

export interface BenchmarkComparison {
    baseCommit: string;
    targetCommit: string;
    comparisons: ResultComparison[]
}

function compareResults(baseResults: StatsNode[], targetResults: StatsNode[]): ResultComparison[] {
    const comparison: ResultComparison[] = []

    if (baseResults && baseResults.length && targetResults && targetResults.length) {
        baseResults.forEach(baseResult => {
            const targetResult = targetResults.find(r => r.name === baseResult.name);
            if (! targetResult) {
                console.log(`Skipping benchmark test ${baseResult.name} since we couldn't find it in target. The test has probably been changed between commits`)
                return
            }

            if (baseResult.type === "group" && targetResult.type === "group") {
                const group: ResultComparisonGroup = {
                    type: "group",
                    name: baseResult.name,
                    comparisons: compareResults(baseResult.nodes, targetResult.nodes)
                }
                comparison.push(group);
            } else if (baseResult.type === "benchmark" && targetResult.type === "benchmark") {
                const benchmark: ResultComparisonBenchmark = {
                    type: "benchmark",
                    name: baseResult.name,
                    metrics: {}
                }

                Object.keys(baseResult.metrics).forEach((metricName) => {
                    const baseMetrics = baseResult.metrics[metricName as BenchmarkMetricNames];
                    const targetMetrics = targetResult.metrics[metricName as BenchmarkMetricNames];

                    if (baseMetrics && targetMetrics) {
                        const samplesComparison = compareSamples(baseMetrics.stats.samples, targetMetrics.stats.samples);

                        const baseStats = baseMetrics.stats;
                        const targetStats = targetMetrics.stats;

                        benchmark.metrics[metricName as BenchmarkMetricNames] = {
                            baseStats,
                            targetStats,
                            samplesComparison
                        }
                    }
                })
                
                comparison.push(benchmark)
            } else {
                console.log(`Skipping benchmark test ${baseResult.name} since it's base type and target type were not the same.`)
            }
        })
    }

    return comparison;
}

export async function compareBenchmarkStats(baseCommit: string, targetCommit: string, projectNames: string[], storageProvider: any): Promise<BenchmarkComparison> {
    const projectStats: {
        name: string;
        base: StatsResults[];
        target: StatsResults[];
    }[] = await Promise.all(projectNames.map(async (name) => {
        return {
            name,
            base: await storageProvider.getAllBenchmarkStatsPerCommit(projectNames, baseCommit),
            target: await storageProvider.getAllBenchmarkStatsPerCommit(projectNames, targetCommit)
        }
    }))

    const commitComparison: BenchmarkComparison = {
        baseCommit,
        targetCommit,
        comparisons: [],
    }

    projectStats.forEach(project => {
        const allBaseStats = project.base;
        const allTargetStats = project.target;

        if (allBaseStats && allTargetStats) {
            const comparisons: ResultComparison[] = []

            allBaseStats.forEach(baseStats => {
                const { benchmarkName } = baseStats;
                const targetStats = allTargetStats.find(s => s.benchmarkName === benchmarkName)

                if (! targetStats) {
                    console.log(`Skipping benchmark ${benchmarkName} since we couldn't find it in commit ${targetCommit}`)
                    return;
                }
                const { version: baseVersion, results: baseResults } = baseStats;
                const { version: targetVersion, results: targetResults } = targetStats;

                if (baseVersion !== targetVersion) {
                    console.log(`Skipping comparing ${benchmarkName} since stat versions are different`)
                    return
                }

                const comparison = compareResults(baseResults, targetResults)
                const benchmark: ResultComparisonGroup = {
                    type: "group",
                    name: benchmarkName,
                    comparisons: comparison
                }
                
                comparisons.push(benchmark)
            })

            const projectComparison: ResultComparisonProject = {
                type: "project",
                name: project.name,
                comparisons
            }
            commitComparison.comparisons.push(projectComparison)
        }
    })

    return commitComparison;
}
