import { cacheDirectory } from '@best/utils';

export default {
    cache: true,
    cacheDirectory: cacheDirectory(),
    staticFiles: {},
    openBenchmarks: false,
    moduleDirectories: ['node_modules'],
    moduleFileExtensions: ['js'],
    moduleNameMapper: {},
    modulePathIgnorePatterns: [],
    runner: "default",
    runnerConfig: [{ runner: '@best/runner-headless', config: {} }],
    benchmarkEnvironment: 'production',
    benchmarkMaxDuration: 1000 * 10, // 10s
    benchmarkMinIterations: 30,
    benchmarkOnClient: false,
    benchmarkIterations: undefined,
    benchmarkOutput: '<rootDir>/__benchmarks_results__',
    benchmarkEnvironmentOptions: {},

    testMatch: ['**/__benchmarks__/**/*.benchmark.js'],
};
