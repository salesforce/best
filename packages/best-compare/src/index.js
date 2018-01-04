export async function compareBenchmarkStats(baseCommit, compareCommit, projectName, storageProvider) {
    const statsBaseCommit = await storageProvider.getBenchmarkStats(projectName, baseCommit);
}
