import { getBenchmarkRootNode } from './state';
import { runBenchmarkIteration } from "./run_iteration";

function collectResults(node) {
    const { name, duration, startedAt, run } = node;
    const resultNode = { name, duration, startedAt };

    if (run) {
        resultNode.runDuration = run.runDuration;
    } else {
        resultNode.benchmarks = node.children.map((c) => collectResults(c));
    }

    return resultNode;
}

async function runIterations(config) {
    if (config.executedTime < config.maxDuration ||
        config.executedIterations < config.minSampleCount
    ) {
        const useMacroTaskAfterBenchmark = config;
        const benchmark = await runBenchmarkIteration(getBenchmarkRootNode(), { useMacroTaskAfterBenchmark });
        const results = collectResults(benchmark);
        config.collectedResults.push(results);
        config.executedTime += benchmark.duration;
        config.executedIterations += 1;
        return runIterations(config);
    }

    return config;
}

export async function runBenchmark(benchmarkConfig) {
    const { clientIterations } = benchmarkConfig;
    if (!clientIterations) {
        benchmarkConfig.maxDuration = 1;
        benchmarkConfig.minSampleCount = 1;
    }

    benchmarkConfig.collectedResults = [];
    return runIterations(benchmarkConfig);
}
