"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const globby_1 = __importDefault(require("globby"));
const builder_1 = require("@best/builder");
const runner_1 = require("@best/runner");
const messager_1 = require("@best/messager");
const store_1 = require("@best/store");
const analyzer_1 = require("@best/analyzer");
const path_1 = __importDefault(require("path"));
const micromatch_1 = __importDefault(require("micromatch"));
const IGNORE_PATHS = [
    '**/__benchmarks_results__/**',
    '**/node_modules/**',
    '**/__tests__/**'
];
async function getBenchmarkPaths({ rootDir }, config) {
    const { testMatch, rootDir: projectRoot } = config;
    const cwd = projectRoot || rootDir;
    const ignorePaths = IGNORE_PATHS.concat(config.testPathIgnorePatterns || []);
    const results = await globby_1.default(testMatch, { cwd, ignore: ignorePaths });
    return results.map((p) => path_1.default.resolve(cwd, p));
}
function filterBenchmarks(matches, { nonFlagArgs, rootDir }) {
    if (!nonFlagArgs || !nonFlagArgs.length) {
        return matches;
    }
    const patterns = nonFlagArgs.map((p) => {
        // To provide a good test matching we need to disambiguate between
        // glob patterns vs. full path diretory vs a specific file.
        if (p.includes('*')) {
            return p;
        }
        if (path_1.default.extname(p)) {
            return path_1.default.resolve(rootDir, p);
        }
        return path_1.default.join(path_1.default.resolve(rootDir, p), '**');
    });
    return micromatch_1.default(matches, patterns);
}
function validateBenchmarkNames(matches) {
    matches.reduce((visited, p) => {
        const filename = path_1.default.basename(p);
        if (visited[filename]) {
            throw new Error(`Duplicated benchmark filename "${filename}". All benchmark file names must be unique.`);
        }
        visited[filename] = true;
        return visited;
    }, {});
}
async function getBenchmarkTests(configs, globalConfig) {
    return Promise.all(configs.map(async (config) => {
        let matches = await getBenchmarkPaths(globalConfig, config);
        matches = filterBenchmarks(matches, globalConfig);
        validateBenchmarkNames(matches);
        return { config, matches };
    }));
}
async function buildBundleBenchmarks(benchmarksTests, globalConfig, messager) {
    const bundle = [];
    // @dval: We don't parallelize here for now since this wouldn't give us much,
    // Unless we do proper spawning on threads
    for (const benchmarkTest of benchmarksTests) {
        const { matches, config } = benchmarkTest;
        const result = await builder_1.buildBenchmarks(matches, config, globalConfig, messager);
        bundle.push(result);
    }
    // Flatten the per-project benchmarks tests
    return bundle.reduce((benchmarks, benchBundle) => {
        benchmarks.push(...benchBundle);
        return benchmarks;
    }, []);
}
async function runBundleBenchmarks(benchmarksBuilds, globalConfig, messager) {
    return runner_1.runBenchmarks(benchmarksBuilds, globalConfig, messager);
}
function hasMatches(benchmarksTests) {
    return benchmarksTests.some(({ matches }) => matches.length);
}
async function runBest(globalConfig, configs, outputStream) {
    const benchmarksTests = await getBenchmarkTests(configs, globalConfig);
    if (!hasMatches(benchmarksTests)) {
        outputStream.write('No benchmark matches found. \n');
        return [];
    }
    const buildMessager = new messager_1.BuildStateMessager(benchmarksTests, globalConfig, outputStream);
    const benchmarksBuilds = await buildBundleBenchmarks(benchmarksTests, globalConfig, buildMessager);
    buildMessager.finishBuild();
    const runnerMessager = new messager_1.RunnerMessager(benchmarksBuilds, globalConfig, outputStream);
    const benchmarkBundleResults = await runBundleBenchmarks(benchmarksBuilds, globalConfig, runnerMessager);
    runnerMessager.finishRun();
    await analyzer_1.analyzeBenchmarks(benchmarkBundleResults);
    await store_1.storeBenchmarkResults(benchmarkBundleResults, globalConfig);
    return benchmarkBundleResults;
}
exports.runBest = runBest;
//# sourceMappingURL=run_best.js.map