import { preRunMessager } from '@best/messager';
import { compareBenchmarkStats } from '@best/compare';
import { pushBenchmarkComparison } from '@best/github-integration';

export async function runCompare(globalConfig, configs, outputStream) {
    const { gitLocalChanges, gitIntegration, externalStorage, compareStats } = globalConfig;
    const commits = compareStats || [];
    const [baseCommit, compareCommit] = commits;

    if (gitLocalChanges) {
        throw new Error('No local changes are allowed when comparing benchmarks');
    }

    if (!externalStorage) {
        throw new Error('WIP - Do not support local comparison just yet. You need a --externalStorage');
    }

    if (commits.length === 0 || commits.length > 2) {
        throw new Error('Wrong number of commmits to compare we are expectine one or two');
    }

    if (baseCommit === compareCommit) {
        console.log(`Hash of commits are identical (${baseCommit}). Skipping comparison`);
        return false;
    }

    const projects = configs.map(cfg => cfg.projectName);
    const projectNames = projects.length ? projects : [globalConfig.rootProjectName];
    let storageProvider;
    try {
        storageProvider = require(externalStorage);
    } catch (err) {
        throw new Error(`Can't resolve the externalStorage ${externalStorage}`);
    }

    preRunMessager.print('\n Fetching benchmark results to compare... \n\n', outputStream);
    const compareResults = await compareBenchmarkStats(baseCommit, compareCommit, projectNames, storageProvider);

    if (gitIntegration) {
        await pushBenchmarkComparison(baseCommit, compareCommit, compareResults, globalConfig);
    }

    return compareResults;
}
