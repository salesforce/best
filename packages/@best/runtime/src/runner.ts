import { getBenchmarkRootNode } from './state';
import { runBenchmarkIteration } from './run_iteration';
import { normalizeResults } from './results';
import { validateState } from "./utils/validate";
import { BenchmarkResultNode, ResultNodeTypes, BenchmarkResults, BenchmarkResultBenchmarkNode, BenchmarkResultGroupNode } from "@best/types";

function collectNodeResults(node: RuntimeNode): BenchmarkResultNode {
    const { name, aggregate, startedAt, run, children  } = node;
    const type = node.type as ResultNodeTypes;
    const resultNode = { type, name, aggregate, startedAt };

    if (run) {
        resultNode.aggregate = run.aggregate;
        (resultNode as BenchmarkResultBenchmarkNode).metrics = run.metrics;
    } else if (children) {
        (resultNode as BenchmarkResultGroupNode).nodes = children.map((c: RuntimeNode) => collectNodeResults(c));
    }

    return (resultNode as BenchmarkResultNode);
}

async function runIterations(config: BenchmarkState): Promise<BenchmarkState> {
    if (config.executedTime < config.maxDuration || config.executedIterations < config.minSampleCount) {
        const { useMacroTaskAfterBenchmark } = config;

        const benchmark = await runBenchmarkIteration(getBenchmarkRootNode(), { useMacroTaskAfterBenchmark });
        const results = collectNodeResults(benchmark);
        config.results.push(results);
        config.executedTime += benchmark.aggregate;
        config.executedIterations += 1;

        if (!config.iterateOnClient) {
            return config;
        }

        return runIterations(config);
    }

    return config;
}

export async function runBenchmark(benchmarkState: BenchmarkState): Promise<BenchmarkResults> {
    validateState(benchmarkState);
    if (benchmarkState.benchmarkDefinitionError) {
        throw benchmarkState.benchmarkDefinitionError;
    }

    benchmarkState.results = [];
    await runIterations(benchmarkState);
    return normalizeResults(benchmarkState);
}
