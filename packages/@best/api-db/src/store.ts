import crypto from 'crypto';
import { loadDbFromConfig } from './utils';
import { TemporarySnapshot, Metric } from './types';
import { FrozenGlobalConfig, BenchmarkResultsSnapshot, BenchmarkMetricNames, StatsNode } from '@best/types';

interface RunSettings {
    similarityHash: string;
    commit: string;
    commitDate: string;
    environmentHash: string;
    temporary: boolean;
}

function md5(data: string) {
    return crypto
        .createHash('md5')
        .update(data)
        .digest('hex');
}

const generateSnapshots = (runSettings: RunSettings, benchmarks: StatsNode[], groupName?: string): TemporarySnapshot[] => {
    return benchmarks.reduce((results, benchmark): TemporarySnapshot[] => {
        if (benchmark.type === "benchmark") {
            const metrics = Object.keys(benchmark.metrics).reduce((results, metricName: string): Metric[] => {
                const values = benchmark.metrics[metricName as BenchmarkMetricNames];

                if (values) {
                    return [
                        ...results,
                        {
                            name: metricName,
                            duration: values.stats.median,
                            stdDeviation: Math.sqrt(values.stats.variance)
                        }
                    ]
                }

                return results;
            }, <Metric[]>[])

            const snapshot: TemporarySnapshot = {
                ...runSettings,
                name: `${groupName ? groupName + '/' : ''}${benchmark.name}`,
                metrics: metrics
            }

            return [...results, snapshot]
        } else if (benchmark.type === "group") {
            return [...results, ...generateSnapshots(runSettings, benchmark.nodes, benchmark.name)]
        }

        return results;
    }, <TemporarySnapshot[]>[])
}

export const saveBenchmarkSummaryInDB = async (benchmarkResults: BenchmarkResultsSnapshot[], globalConfig: FrozenGlobalConfig) => {
    const db = loadDbFromConfig(globalConfig);

    await db.migrate()

    return Promise.all(
        benchmarkResults.map(async (benchmarkResult) => {
            const { benchmarkInfo: { benchmarkSignature }, projectConfig, environment, stats } = benchmarkResult;
            const { projectName } = projectConfig;
            const { lastCommit, branch } = globalConfig.gitInfo;

            const snapshotEnvironment = {
                hardware: environment.hardware,
                browser: environment.browser
            }

            const environmentHash = md5(JSON.stringify(snapshotEnvironment));

            const runSettings = {
                similarityHash: benchmarkSignature,
                commit: lastCommit.hash,
                commitDate: lastCommit.date,
                environmentHash,
                temporary: branch !== 'master'
            }

            if (stats) {
                const snapshots = generateSnapshots(runSettings, stats.results);
                return db.saveSnapshots(snapshots, projectName);
            } else {
                return false;
            }
        }),
    );
}
