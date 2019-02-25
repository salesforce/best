import { cpus } from 'os';
import { buildBenchmark } from "./build-benchmark";
import { BuildBenchmarkCluster, buildBenchmarksInParallel } from "./parallel-utils";

const numCPUs = cpus().length;

export async function buildBenchmarks(benchmarks, projectConfig, globalConfig, messager) {
    let result;

    if (numCPUs > 1) {
        const cluster = new BuildBenchmarkCluster(Math.min(benchmarks.length, numCPUs));
        result = await buildBenchmarksInParallel(benchmarks, projectConfig, globalConfig, messager, cluster);
        cluster.tearDown();
    } else {
        // Since there is only 1 CPU, it will be faster to just run everything without forking into a new process
        result = [];
        for (const benchmark of benchmarks) {
            const build = await buildBenchmark(benchmark, projectConfig, globalConfig, messager);
            result.push(build);
        }
    }

    return result;
}
