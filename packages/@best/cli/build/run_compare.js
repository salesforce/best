"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const messager_1 = require("@best/messager");
const compare_1 = require("@best/compare");
const github_integration_1 = require("@best/github-integration");
const run_best_1 = require("./run_best");
const promise_1 = __importDefault(require("simple-git/promise"));
const STORAGE_FS = '@best/store-fs';
const isHex = (x) => /^[0-9a-fA-F]+$/.test(x);
const normalizeCommit = async (commit, gitCLI) => {
    if (commit === 'current') {
        const result = await gitCLI.log();
        commit = result.latest.hash;
    }
    if (!isHex(commit)) {
        // If is not hexadecimal we try to look for a local branch
        commit = await gitCLI.revparse([commit]);
    }
    return commit.slice(0, 7);
};
async function runCompare(globalConfig, configs, outputStream) {
    const { gitLocalChanges, rootDir, gitIntegration, externalStorage, compareStats = [] } = globalConfig;
    const gitCLI = promise_1.default(rootDir);
    const status = await gitCLI.status();
    const initialBranch = status.current;
    let baseCommit = compareStats[0] || 'master';
    let compareCommit = compareStats[1] || (gitLocalChanges ? 'local' : 'current');
    let stashedLocalChanges = false;
    if (compareStats.length > 2) {
        throw new Error('Cannot compare more than 2 commits.');
    }
    // Get commit hash substrings.
    baseCommit = await normalizeCommit(baseCommit, gitCLI);
    if (compareCommit !== 'local') {
        compareCommit = await normalizeCommit(compareCommit, gitCLI);
    }
    if (baseCommit === compareCommit) {
        console.log(`Hash of commits are identical (${baseCommit}). Skipping comparison`);
        return false;
    }
    try {
        const projects = configs.map((cfg) => cfg.projectName);
        const projectNames = projects.length ? projects : [globalConfig.rootProjectName];
        const runConfig = { ...globalConfig, gitLocalChanges: false };
        let storageProvider;
        // If not external storage we will run the benchmarks and compare using fs
        if (!externalStorage) {
            storageProvider = require(STORAGE_FS);
            storageProvider.initialize({ rootDir });
            if (gitLocalChanges) {
                await gitCLI.stash({ '--include-untracked': true });
                stashedLocalChanges = true;
            }
            // Run base commit.
            messager_1.preRunMessager.print(`\n Running best for commit ${baseCommit} \n`, outputStream);
            await gitCLI.checkout(baseCommit);
            await run_best_1.runBest({ ...runConfig, gitCommit: baseCommit }, configs, outputStream);
            // Run local changes or compare commit.
            if (compareCommit === 'local') {
                messager_1.preRunMessager.print(`\n Running best for local changes \n`, outputStream);
                await gitCLI.checkout(initialBranch);
                if (stashedLocalChanges) {
                    await gitCLI.stash({ pop: true });
                }
            }
            else {
                messager_1.preRunMessager.print(`\n Running best for commit ${compareCommit} \n`, outputStream);
                await gitCLI.checkout(compareCommit);
            }
            await run_best_1.runBest({ ...runConfig, gitCommit: compareCommit }, configs, outputStream);
        }
        else {
            try {
                storageProvider = require(externalStorage);
                storageProvider.initialize({});
            }
            catch (err) {
                throw new Error(`Can't resolve the externalStorage ${externalStorage}`);
            }
        }
        const compareResults = await compare_1.compareBenchmarkStats(baseCommit, compareCommit, projectNames, storageProvider);
        if (gitIntegration) {
            await github_integration_1.pushBenchmarkComparison(baseCommit, compareCommit, compareResults, globalConfig);
        }
        return compareResults;
    }
    finally {
        // Return local files to their initial state no matter what happens.
        await gitCLI.checkout(initialBranch);
        if (stashedLocalChanges) {
            await gitCLI.stash({ pop: true });
        }
    }
}
exports.runCompare = runCompare;
//# sourceMappingURL=run_compare.js.map