import { initializeBenchmarkConfig, getBenckmarkState } from './state';
import { runBenchmark as _runBenchmark } from "./runner";

export * from "./primitives";

const setupBenchmark = (config) => initializeBenchmarkConfig(config);
const runBenchmark = async (config) => {
    if (config) {
        setupBenchmark(config);
    }

    const benchmarkState = getBenckmarkState();
    const benchmarkResults = await _runBenchmark(benchmarkState);
    return benchmarkResults;
};

// Expose BEST API
const BEST = { setupBenchmark, runBenchmark };
window.BEST = BEST;

// TODO: Double check in engine
// This will probably have to go in globals or something like that
window.process = { env: { NODE_ENV : 'development' } };

window.addEventListener('load', async () => {
    const config = setupBenchmark(window.BEST_CONFIG);
    if (config.autoStart) {
        window.BEST_RESULTS = await runBenchmark();
    }
});
