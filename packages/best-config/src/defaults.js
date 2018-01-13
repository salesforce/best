import { cacheDirectory } from '@best/utils';

export default ({
    cache: true,
    cacheDirectory: cacheDirectory(),
    moduleDirectories: ['node_modules'],
    moduleFileExtensions: ['js'],
    moduleNameMapper: {},
    modulePathIgnorePatterns: [],
    benchmarkRunner: 'best-runner-headless',
    benchmarkRunnerConfig: {},
    benchmarkEnvironment: 'production',
    benchmarkMaxDuration: 1000 * 10, // 10s
    benchmarkMinIterations: 30,
    benchmarkOnClient: false,
    benchmarkIterations: undefined,
    benchmarkOutput: '<rootDir>/__benchmark_results__',
    benchmarkEnvironmentOptions: {},

    testMatch: ['**/__benchmarks__/**/*.js', '**/?(*.)(spec|test).js'],
});
