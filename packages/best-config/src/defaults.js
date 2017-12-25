import os from 'os';
import path from 'path';

const cacheDirectory = (() => {
    const { getuid } = process;
    if (getuid == null) {
        return path.join(os.tmpdir(), 'jest');
    }
    // On some platforms tmpdir() is `/tmp`, causing conflicts between different
    // users and permission issues. Adding an additional subdivision by UID can
    // help.
    return path.join(os.tmpdir(), 'best_' + getuid.call(process).toString(36));
})();

export default ({
    cache: true,
    cacheDirectory,
    globals: {},
    moduleDirectories: ['node_modules'],
    moduleFileExtensions: ['js'],
    moduleNameMapper: {},
    modulePathIgnorePatterns: [],
    runner: 'best-runner',
    testEnvironment: 'best-headless',
    testEnvironmentOptions: {},
    testMatch: ['**/__benchmarks__/**/*.js', '**/?(*.)(spec|test).js'],
});
