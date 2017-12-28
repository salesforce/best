import { mergeState, getStateRootNode } from './state';
import { runBenchmark as _runBenchmark } from "./runner";

export * from "./primitives";

const initializeBenchmarkConfig = () => mergeState(window.BEST_CONFIG);
const runBenchmark = async() => {
    const state = getStateRootNode();
    await _runBenchmark(state);
    return state;
}

const BEST = {
    runBenchmark,
};

// TODO: Double check in engine
// This will probably have to go in globals or something like that
window.process = { env: { NODE_ENV : 'development' } };

window.BEST = BEST;
window.addEventListener('load', async () => {
    const config = initializeBenchmarkConfig();
    if (config.autoStart) {
        await runBenchmark();
    }
});
