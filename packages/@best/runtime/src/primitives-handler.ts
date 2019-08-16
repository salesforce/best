/*
 * Copyright (c) 2019, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: MIT
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/MIT
*/

import { makeDescribe, makeBenchmark, makeBenchmarkRun } from './utils/primitives-nodes';

const handler = (event: PrimitiveNode, state: BenchmarkState) => {
    switch (event.nodeType) {
        case 'start_describe_definition': {
            const { nodeName, mode } = event;
            const currentDescribeBlock = state.currentDescribeBlock as RuntimeNodeDescribe;
            const describeBlock = makeDescribe(nodeName, currentDescribeBlock, mode);
            currentDescribeBlock.children.push(describeBlock);
            state.currentDescribeBlock = describeBlock;
            break;
        }

        case 'start_benchmark_definition': {
            const { nodeName, mode } = event;
            const currentDescribeBlock = state.currentDescribeBlock as RuntimeNodeDescribe;
            const benchmarkBlock = makeBenchmark(nodeName, currentDescribeBlock, mode);
            currentDescribeBlock.children.push(benchmarkBlock);
            state.currentDescribeBlock = benchmarkBlock;
            break;
        }

        case 'finish_describe_definition':
        case 'finish_benchmark_definition': {
            const currentDescribeBlock = state.currentDescribeBlock as RuntimeNodeDescribe | RuntimeNodeBenchmark;
            if (!currentDescribeBlock) {
                throw new Error(`"currentDescribeBlock" has to be there since we're finishing its definition.`);
            }

            if (currentDescribeBlock.type === "benchmark" && !currentDescribeBlock.run) {
                throw new Error(
                    `Benchmark "${
                        currentDescribeBlock.name
                    }" must have a 'run()' function or contain benchmarks inside.`,
                );
            }

            if (currentDescribeBlock.parent) {
                state.currentDescribeBlock = currentDescribeBlock.parent;
            }

            break;
        }

        case 'add_hook': {
            const { currentDescribeBlock } = state;
            const { fn, hookType: type } = event;

            if (fn && type) {
                currentDescribeBlock.hooks.push({ fn, type });
            }
            break;
        }

        case 'run_benchmark': {
            const currentDescribeBlock = state.currentDescribeBlock as RuntimeNodeBenchmark;
            const { fn } = event;
            if (fn) {
                const benchmark = makeBenchmarkRun(fn, currentDescribeBlock);
                currentDescribeBlock.run = benchmark;
            }
            break;
        }

        default:
            break;
    }
};

export default handler;
