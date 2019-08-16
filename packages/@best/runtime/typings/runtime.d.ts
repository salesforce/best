/*
 * Copyright (c) 2019, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: MIT
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/MIT
*/

type NodeTypes = "group" | "benchmark" | "run";

interface RuntimeHook {
    type: string;
    fn: Function;
}

interface RuntimeNode {
    type: NodeTypes;
    name: string;
    hooks: RuntimeHook[];
    startedAt: number;
    children?: RuntimeNode[];
    run?: RuntimeNodeRunner;
    aggregate: number;
}
interface RuntimeNodeDescribe extends RuntimeNode {
    type: "group";
    mode?: string;
    parent: any;
    children: RuntimeNode[];
}

interface RuntimeNodeBenchmark extends RuntimeNode {
    type: "benchmark",
    mode?: string;
    parent: RuntimeNodeDescribe;
    run?: RuntimeNodeRunner;
}
interface RuntimeNodeRunner extends RuntimeNode {
    type: "run";
    fn: Function;
    parent: RuntimeNodeBenchmark;
    metrics: { [key: string]: number }
}

type RuntimeNode = RuntimeNodeDescribe | RuntimeNodeBenchmark | RuntimeNodeRunner;

interface BenchmarkState {
    benchmarkName: string;
    autoStart?: boolean;
    benchmarkDefinitionError?: any;
    iterateOnClient?: boolean;
    useMacroTaskAfterBenchmark: boolean;
    maxDuration: number;
    minSampleCount: number;
    iterations: number;
    results: any;
    executedTime: number;
    executedIterations: number;
    currentDescribeBlock: RuntimeNode;
    rootDescribeBlock: RuntimeNodeDescribe;
}

interface PrimitiveNode {
    nodeType: string;
    nodeName: string;
    mode?: string;
    hookType?: string;
    fn?: Function;
}

interface BenchmarkConfig {
    autoStart?: boolean;
    iterations: number,
    iterateOnClient: boolean,
    minSampleCount: number,
    maxDuration: number
}
