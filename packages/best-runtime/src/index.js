import { dispatch, mergeState, getStateRootNode } from './state';
import { nextTick, time } from "./utils/index";
import { HOOKS, RUN_BENCHMARK } from "./constants";
import { runBenchmark } from "./runner";

export * from "./primitives";

const initializeBenchmark = () => {
    const benchmark_config = window.BENCHMARK_CONFIG;
    mergeState(benchmark_config);
    runBenchmark(getStateRootNode());
};

window.addEventListener('load', initializeBenchmark);


