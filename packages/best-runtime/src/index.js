import { initializeBenchmarkConfig, getBenckmarkState } from './state';
import { runBenchmark as _runBenchmark } from "./runner";

export * from "./primitives";

const setupBenchmark = (config) => initializeBenchmarkConfig(config);
const runBenchmark = async (config) => {
    if (config) {
        setupBenchmark(config);
    }

    const benchmarkState = getBenckmarkState();
    await _runBenchmark(benchmarkState);
    return benchmarkState.collectedResults;
};

const BEST = {
    setupBenchmark,
    runBenchmark,
};

// TODO: Double check in engine
// This will probably have to go in globals or something like that
window.process = { env: { NODE_ENV : 'development' } };

window.BEST = BEST;
window.addEventListener('load', async () => {
    const config = setupBenchmark(window.BEST_CONFIG);
    if (config.autoStart) {
        await runBenchmark();
    }
});
