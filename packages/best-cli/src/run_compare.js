import { preRunMessager } from '@best/messager';
import { compareBenchmarkStats } from '@best/compare';
import { pushBenchmarkComparison } from '@best/github-integration';
import git from "simple-git/promise";

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
        throw new Error(`Can't compare benchmmarks due to uncommited local changes in this branch.`);
    }

    if (compareStats.length === 0 || compareStats.length > 2) {
        throw new Error('Wrong number of commmits to compare we are expectine one or two');
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
        let compareResults;

        if (externalStorage) {
            try {
                storageProvider = require(externalStorage);
            } catch (err) {
                throw new Error(`Can't resolve the externalStorage ${externalStorage}`);
            }

            preRunMessager.print('\n Fetching benchmark results to compare... \n\n', outputStream);
            compareResults = await compareBenchmarkStats(baseCommit, compareCommit, projectNames, storageProvider);
        } else {
            console.log('Run like a puta!');
        }

        if (gitIntegration) {
            await pushBenchmarkComparison(baseCommit, compareCommit, compareResults, globalConfig);
        }

        return compareResults;
    } finally {
        await gitCLI.checkout(initialBranch);
    }
}
