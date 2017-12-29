export default Object.freeze({
    iterateOnClient: undefined,
    useMacroTaskAfterBenchmark: true,
    maxDuration: 1000 * 20, // 20 seconds
    minSampleCount: 30,
    iterations: 1,

    // Internals
    hasFocusedTests: false,
    results: null,

    // Runtime
    executedTime: 0,
    executedIterations: 0,

    // Memory
    memoryAllocatedStart: 0,
    memoryAllocatedFinish: 0
});
