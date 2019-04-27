export default Object.freeze({
    iterateOnClient: undefined,
    useMacroTaskAfterBenchmark: true,
    maxDuration: 1000 * 20,
    minSampleCount: 30,
    iterations: 0,
    // Internals
    hasFocusedTests: false,
    results: null,
    // Runtime
    executedTime: 0,
    executedIterations: 0,
    // Memory
    memoryAllocatedStart: 0,
    memoryAllocatedFinish: 0,
});
//# sourceMappingURL=default-state.js.map