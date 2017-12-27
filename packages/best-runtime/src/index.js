import { mergeState, getStateRootNode } from './state';
import { runBenchmark } from "./runner";

export * from "./primitives";

const initializeBenchmarkConfig = () => mergeState(window.BENCHMARK_CONFIG);
const startBenchmark = () => runBenchmark(getStateRootNode());

window.addEventListener('load', async () => {
    const config = initializeBenchmarkConfig();
    if (config.autoStart) {
        await startBenchmark();
    } else {
        window.startBenchmark = startBenchmark;
    }
});
