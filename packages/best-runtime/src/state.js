import primitivesHandler from "./primitives-handler";
import { makeDescribe } from "./utils/primitives-nodes";

const eventHandlers = [
    primitivesHandler,
    //formatNodeAssertErrors,
  ];

const ROOT_DESCRIBE_BLOCK_NAME = 'ROOT_DESCRIBE_BLOCK';
const ROOT_DESCRIBE_BLOCK = makeDescribe(ROOT_DESCRIBE_BLOCK_NAME);

const INITIAL_STATE = {
    currentDescribeBlock: ROOT_DESCRIBE_BLOCK,
    hasFocusedTests: false,
    rootDescribeBlock: ROOT_DESCRIBE_BLOCK,
    testTimeout: 5000,
};

let STATE = INITIAL_STATE;
export const getState = () => STATE;
export const getStateRootNode = () => STATE.rootDescribeBlock;

export const mergeState = (config) => {
    STATE = {
        ...STATE,
        ...config
    };
};

export function dispatch(event) {
    for (const handler of eventHandlers) {
        handler(event, getState());
    }
}
