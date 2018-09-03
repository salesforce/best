import { getBenchmarkRootNode } from './state';
import { runBenchmarkIteration } from './run_iteration';
import { normalizeResults } from './results';
import { validateState } from "./utils/validate";

function collectResults(node) {
    const { name, duration, startedAt, run } = node;
    const resultNode = { name, duration, startedAt };

    if (run) {
        resultNode.duration = run.duration;
        resultNode.runDuration = run.runDuration;
    } else {
        resultNode.benchmarks = node.children.map(c => collectResults(c));
    }

    return resultNode;
}

async function runIterations(config) {
    if (config.executedTime < config.maxDuration || config.executedIterations < config.minSampleCount) {
        const { useMacroTaskAfterBenchmark } = config;
        const benchmark = await runBenchmarkIteration(getBenchmarkRootNode(), {
            useMacroTaskAfterBenchmark,
        });
        const results = collectResults(benchmark);
        config.results.push(results);
        config.executedTime += benchmark.duration;
        config.executedIterations += 1;

        if (!config.iterateOnClient) {
            return config;
        }

        return runIterations(config);
    }

    return config;
}

export async function runBenchmark(benchmarkState) {
    validateState(benchmarkState);
    if (benchmarkState.benchmarkDefinitionError) {
        throw benchmarkState.benchmarkDefinitionError;
    }

    benchmarkState.results = [];
    await runIterations(benchmarkState);
    return normalizeResults(benchmarkState);
}
