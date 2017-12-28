import { makeDescribe, makeBenchmark, makeBenchmarkRun } from "./utils/primitives-nodes";

const handler = (event, state) => {
    switch (event.name) {
        case 'start_describe_definition': {
            const { blockName, mode } = event;
            const { currentDescribeBlock } = state;
            const describeBlock = makeDescribe(blockName, currentDescribeBlock, mode);
            currentDescribeBlock.children.push(describeBlock);
            state.currentDescribeBlock = describeBlock;
            break;
        }

        case 'start_benchmark_definition': {
            const { blockName, mode } = event;
            const { currentDescribeBlock } = state;
            const describeBlock = makeBenchmark(blockName, currentDescribeBlock, mode);
            currentDescribeBlock.children.push(describeBlock);
            state.currentDescribeBlock = describeBlock;
            break;
        }

        case 'finish_describe_definition':
        case 'finish_benchmark_definition': {
            const { currentDescribeBlock } = state;
            if (!currentDescribeBlock) {
                throw new Error(`"currentDescribeBlock" has to be there since we're finishing its definition.`, );
            }
            if (currentDescribeBlock.parent) {
                state.currentDescribeBlock = currentDescribeBlock.parent;
            }
            break;
        }

        case 'add_hook': {
            const { currentDescribeBlock } = state;
            const { fn, hookType: type } = event;
            currentDescribeBlock.hooks.push({ fn, type });
            break;
        }

        case 'run_benchmark': {
            const { currentDescribeBlock } = state;
            const { fn } = event;
            const benchmark = makeBenchmarkRun(fn, currentDescribeBlock);
            currentDescribeBlock.run = benchmark;
            break;
        }

        default: break;
    }
};

export default handler;
