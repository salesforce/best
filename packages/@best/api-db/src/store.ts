import crypto from 'crypto';
import { loadDbFromConfig } from './utils';
import { TemporarySnapshot, Metric } from './types';
import { FrozenGlobalConfig, BenchmarkResultsSnapshot, StatsNode, RunnerConfig } from '@best/types';

interface RunSettings {
    similarityHash: string;
    commit: string;
    commitDate: string;
    environmentHash: string;
    temporary: boolean;
    branch: string;
}

function md5(data: string) {
    return crypto
        .createHash('md5')
        .update(data)
        .digest('hex');
}

const generateSnapshots = (runSettings: RunSettings, benchmarks: StatsNode[], snapshots: TemporarySnapshot[] = []): TemporarySnapshot[] => {
    const things: TemporarySnapshot[] = benchmarks.reduce((results, benchmark): TemporarySnapshot[] => {
        if (benchmark.type === "benchmark") {
            Object.keys(benchmark.metrics).forEach((key: string) => {
                const values = benchmark.metrics[key as BenchmarkMetricNames].stats;

            })
        }

        return results;
    }, <TemporarySnapshot[]>[])

    return snapshots;
}

export const saveBenchmarkSummaryInDB = (benchmarkResults: BenchmarkResultsSnapshot[], globalConfig: FrozenGlobalConfig) => {
    const db = loadDbFromConfig(globalConfig);

    if (! db) { return; }

    return Promise.all(
        benchmarkResults.map(async (benchmarkResult) => {
            const { benchmarkInfo: { benchmarkSignature }, projectConfig, environment, stats } = benchmarkResult;
            const { projectName } = projectConfig;
            const { lastCommit, branch, localChanges } = globalConfig.gitInfo;

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
                temporary: localChanges,
                branch
            }

            const snapshotsToSave: TemporarySnapshot[] = [];

            if (! stats) { return };

            stats.results.map((node) => {

            })

            stats.benchmarks.forEach((element: any) => {
                element.benchmarks.forEach((bench: any) => {
                    const metricKeys = Object.keys(bench).filter(key => key !== 'name')
                    const metrics = metricKeys.map(name => ({
                        name,
                        duration: bench[name].median,
                        stdDeviation: bench[name].medianAbsoluteDeviation,
                    }))

                    const snapshot = {
                        ...runSettings,
                        name: `${element.name}/${bench.name}`,
                        metrics: metrics
                    }
                    snapshotsToSave.push(snapshot);

                });
            });

            return db.saveSnapshots(snapshotsToSave, projectName);
        }),
    );
}
