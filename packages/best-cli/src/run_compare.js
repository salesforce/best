import { preRunMessager } from '@best/messager';
import { compareBenchmarkStats } from '@best/compare';
import { pushBenchmarkComparison } from '@best/github-integration';
import { runBest } from "./run_best";
import git from "simple-git/promise";

const STORAGE_FS = '@best/store-fs';
const isHex = x => /^[0-9a-fA-F]+$/.test(x);
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

export async function runCompare(globalConfig, configs, outputStream) {
    const { gitLocalChanges, rootDir, gitIntegration, externalStorage, compareStats = [] } = globalConfig;
    let [baseCommit, compareCommit] = compareStats;

    if (gitLocalChanges) {
        throw new Error(`Can't compare benchmarks due to uncommitted local changes in this branch.`);
    }

    if (compareStats.length === 0 || compareStats.length > 2) {
        throw new Error('Wrong number of commits to compare we are expecting one or two');
    }

    if (baseCommit === compareCommit) {
        console.log(`Hash of commits are identical (${baseCommit}). Skipping comparison`);
        return false;
    }

    const gitCLI = git(rootDir);
    const status = await gitCLI.status();
    const initialBranch = status.current;

    baseCommit = await normalizeCommit(baseCommit, gitCLI);
    compareCommit = await normalizeCommit(compareCommit, gitCLI);

    try {
        const projects = configs.map(cfg => cfg.projectName);
        const projectNames = projects.length ? projects : [globalConfig.rootProjectName];
        let storageProvider;

        // If not external storage we will run the benchmarks and compare using fs
        if (!externalStorage) {
            storageProvider = require(STORAGE_FS);
            storageProvider.initialize({ rootDir });
            // Run base commit
            preRunMessager.print(`\n Running best for commit ${baseCommit} \n`, outputStream);
            await gitCLI.checkout(baseCommit);
            await runBest({ ...globalConfig, gitCommit: baseCommit }, configs, outputStream);

            // Run compare Commit
            preRunMessager.print(`\n Running best for commit ${compareCommit} \n`, outputStream);
            await gitCLI.checkout(compareCommit);
            await runBest({ ...globalConfig, gitCommit: compareCommit }, configs, outputStream);
        } else {
            try {
                storageProvider = require(externalStorage);
                storageProvider.initialize({});
            } catch (err) {
                throw new Error(`Can't resolve the externalStorage ${externalStorage}`);
            }
        }

        const compareResults = await compareBenchmarkStats(baseCommit, compareCommit, projectNames, storageProvider);

        if (gitIntegration) {
            await pushBenchmarkComparison(baseCommit, compareCommit, compareResults, globalConfig);
        }

        return compareResults;
    } finally {
        await gitCLI.checkout(initialBranch);
    }
}
