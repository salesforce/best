import primitivesHandler from './primitives-handler';
import { makeDescribe } from './utils/primitives-nodes';
import DEFAULT_STATE from './utils/default-state';
import cloneState from "./utils/clone-state";

declare var BEST_CONFIG: any;
const eventHandlers = [ primitivesHandler];
const ROOT_DESCRIBE_BLOCK_NAME = typeof BEST_CONFIG !== 'undefined' ? BEST_CONFIG.benchmarkName : 'ROOT_DESCRIBE_BLOCK';
const ROOT_DESCRIBE_BLOCK = makeDescribe(ROOT_DESCRIBE_BLOCK_NAME);

const STATE: BenchmarkState = Object.assign({}, DEFAULT_STATE, {
    currentDescribeBlock: ROOT_DESCRIBE_BLOCK,
    rootDescribeBlock: ROOT_DESCRIBE_BLOCK,
});

export const getBenckmarkState = () => cloneState(STATE);
export const getBenchmarkRootNode = () => getBenckmarkState().rootDescribeBlock;

export const initializeBenchmarkConfig = (newOpts: BenchmarkConfig): BenchmarkConfig => {
    if (newOpts.iterations !== undefined) {
        if (newOpts.iterateOnClient === undefined) {
            newOpts.iterateOnClient = true;
        }
        newOpts.minSampleCount = newOpts.iterations;
        newOpts.maxDuration = 1;
    }

    return Object.assign(STATE, newOpts);
};

// PROTECTED: Should only be used by the primitives
export function dispatch(event: PrimitiveNode) {
    try {
        for (const handler of eventHandlers) {
            handler(event, STATE);
        }
    } catch (err) {
        STATE.benchmarkDefinitionError = err;
    }
}
