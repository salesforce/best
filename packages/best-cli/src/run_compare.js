import { preRunMessager } from "@best/messager";
import { compareBenchmarkStats } from "@best/compare";
import { pushBenchmarkComparison } from "@best/github-integration";

export async function runCompare(globalConfig, configs, outputStream) {
    const { gitIntegration, externalStorage, compareStats: commits } = globalConfig;

    if (configs.length > 1) {
        throw new Error('WIP - Do not support multiple projects for compare just yet...');
    }

    if (!externalStorage) {
        throw new Error('WIP - Do not support local comparison just yet. You need a --externalStorage');
    }

    if (commits.length === 0 || commits.length > 2) {
        throw new Error('Wrong number of commmits to compare we are expectine one or two');
    }

    const projectConfig = configs[0];
    const [baseCommit, compareCommit] = commits.map(c => c.slice(0, 7));
    const { projectName } = projectConfig;
    let storageProvider;
    try {
        storageProvider = require(externalStorage);
    } catch (err) {
        throw new Error(`Can't resolve the externalStorage ${externalStorage}`);
    }

    preRunMessager.print('\n Fetching benchmark results to compare... \n\n', outputStream);
    const compareResults = await compareBenchmarkStats(baseCommit, compareCommit, projectName, storageProvider);

    if (gitIntegration) {
        await pushBenchmarkComparison(compareResults);
    }

    return compareResults;
}
