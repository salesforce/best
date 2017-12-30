import primitivesHandler from "./primitives-handler";
import { makeDescribe } from "./utils/primitives-nodes";
import DEFAULT_STATE from "./utils/default-state";

const eventHandlers = [
    primitivesHandler,
    //formatNodeAssertErrors,
];

const _benchmarkTitle = () => ((typeof BEST_CONFIG !== 'undefined') ? BEST_CONFIG.benchmarkName : 'ROOT_DESCRIBE_BLOCK');
const ROOT_DESCRIBE_BLOCK_NAME = _benchmarkTitle();
const ROOT_DESCRIBE_BLOCK = makeDescribe(ROOT_DESCRIBE_BLOCK_NAME);

const STATE = Object.assign({}, DEFAULT_STATE, {
    currentDescribeBlock: ROOT_DESCRIBE_BLOCK,
    rootDescribeBlock: ROOT_DESCRIBE_BLOCK
});

const _getInternalState = () => STATE;
const _cloneState = (state) => {
    const stateClone = Object.assign({}, state);

    if (stateClone.children) {
        stateClone.children = stateClone.children.map(c => _cloneState(c));
    }

    return stateClone;
};

export const getBenckmarkState = () => _cloneState(STATE);
export const getBenchmarkRootNode = () => getBenckmarkState().rootDescribeBlock;

export const initializeBenchmarkConfig = (newOpts) => {
    if (newOpts.iterations !== undefined) {
        if (newOpts.iterateOnClient === undefined) {
            newOpts.iterateOnClient = true;
        }
        newOpts.minSampleCount = newOpts.iterations = newOpts.iterations;
        newOpts.maxDuration = 1;
    }

    return Object.assign(STATE, newOpts);
};

// PROTECTED: Should only be used by the primitives
export function dispatch(event) {
    for (const handler of eventHandlers) {
        handler(event, _getInternalState());
    }
}
