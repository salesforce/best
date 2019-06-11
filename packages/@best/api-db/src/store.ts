import crypto from 'crypto';
import { loadDbFromConfig } from './utils';
import { TemporarySnapshot } from './types';

function md5(data: string) {
    return crypto
        .createHash('md5')
        .update(data)
        .digest('hex');
}

export const saveBenchmarkSummaryInDB = (benchmarkResults: any, globalConfig: any) => {
    const db = loadDbFromConfig(globalConfig);

    return Promise.all(
        benchmarkResults.map(async (benchmarkResult: any) => {
            const { benchmarkSignature, projectConfig, environment, stats } = benchmarkResult;
            const { projectName } = projectConfig;
            const { gitCommit, gitCommitDate, gitLocalChanges } = globalConfig;

            const snapshotEnvironment = {
                hardware: environment.hardware,
                browser: environment.browser
            }

            const environmentHash = md5(JSON.stringify(snapshotEnvironment));
            
            const runSettings = {
                similarityHash: benchmarkSignature,
                commit: gitCommit,
                commitDate: gitCommitDate,
                environmentHash,
                // TODO: not sure if this is exactly what we want to determine here 
                temporary: gitLocalChanges
            }

            const snapshotsToSave: TemporarySnapshot[] = [];

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