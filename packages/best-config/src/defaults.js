import os from 'os';
import path from 'path';

const cacheDirectory = (() => {
    const { getuid } = process;
    if (getuid == null) {
        return path.join(os.tmpdir(), 'best');
    }
    // On some platforms tmpdir() is `/tmp`, causing conflicts between different
    // users and permission issues. Adding an additional subdivision by UID can
    // help.
    return path.join(os.tmpdir(), 'best_' + getuid.call(process).toString(36));
})();

export default ({
    cache: true,
    cacheDirectory,
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
