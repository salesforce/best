export async function compareBenchmarkStats(baseCommit, compareCommit, projectName, storageProvider) {

    const [baseStats, compareStats] = await Promise.all([
        storageProvider.getBenchmarkStats(projectName, baseCommit),
        storageProvider.getBenchmarkStats(projectName, compareCommit)
    ]);

    console.log(compareStats);
}
