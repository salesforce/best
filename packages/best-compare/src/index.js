import { compareSamples } from "@best/analyzer";
import { preRunMessager } from "@best/messager";
import { basename } from "path";

function compareEnvironment(baseEnv, targetEnv) {
    // TODO
}

function compareBenchmarks(baseBenchs, targetBenchs, comparison = []) {
    if (baseBenchs && baseBenchs.length && targetBenchs && targetBenchs.length) {
        baseBenchs.forEach((baseBenchmark) => {
            const targetBenchmark = targetBenchs.find(tb => tb.name === baseBenchmark.name);
            if (!targetBenchmark) {
                console.log(
                    `Skipping benchmark test ${baseBenchmark.name} since we couldn't find it in target.` +
                    'The test has probably been changed between commits'
                );
                return;
            }

            if (baseBenchmark.benchmarks) {
                compareBenchmarks(baseBenchmark.benchmarks, targetBenchmark.benchmarks);
            } else {
                // For now compare only duration metrics, we should compare more things
                const baseDurationMetrics = baseBenchmark.duration;
                const targetDurationMetrics = targetBenchmark.duration;
                const durationSampleComparison = compareSamples(baseDurationMetrics.samples, targetDurationMetrics.samples);

                comparison.push({
                    name: baseBenchmark.name,
                    metrics: {
                        duration: { // hardcoded for now
                            baseStats: baseDurationMetrics,
                            targetStats: targetDurationMetrics,
                            samplesComparison: durationSampleComparison // Returns `-1` if slower, `1` if faster, and `0` if indeterminate.
                        }
                    }
                });
            }
        });
    }

    return comparison;
}

export async function compareBenchmarkStats(baseCommit, targetCommit, projectName, storageProvider) {
    const [baseBenchmarks, targetBenchmarks] = await Promise.all([
        storageProvider.getBenchmarkStats(projectName, baseCommit),
        storageProvider.getBenchmarkStats(projectName, targetCommit)
    ]);

    preRunMessager.print('\n Running comparison... \n\n', process.stdout);

    const commitComparison = {
        baseCommit,
        targetCommit,
        comparison: []
    };

    //console.log('>> ', baseBenchmarks, targetBenchmarks);

    baseBenchmarks.forEach((baseBenchmarkBundle) => {
        const { benchmarkName } = baseBenchmarkBundle;
        const targetBenchmarkBundle = targetBenchmarks.find(b => b.benchmarkName === benchmarkName);
        if (!targetBenchmarkBundle) {
            console.log(`Skipping benchmark ${benchmarkName} since we couldn't find it in commit ${targetCommit}`);
            return;
        }
        const { version: baseVersion, environment: baseEnv, benchmarks : baseBenchs } = baseBenchmarkBundle;
        const { version: targetVersion, environment: targetEnv, benchmarks: targetBenchs } = targetBenchmarkBundle;

        if (baseVersion !== targetVersion) {
            console.log(`Skipping comparing ${benchmarkName} since stat versions are different`);
        }

        compareEnvironment(baseEnv, targetEnv);

        const comparison = compareBenchmarks(baseBenchs, targetBenchs);
        commitComparison.comparison.push({ benchmarkName, comparison });
    });

    return commitComparison;
}
