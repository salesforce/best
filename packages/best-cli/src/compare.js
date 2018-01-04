import { preRunMessager, errorMessager } from "@best/messager";
import { compareBenchmarkStats } from "@best/compare";

export async function compareStats(globalConfig, configs, outputStream) {
    const [baseCommit, compareCommit] = globalConfig.compareStats;
    const { externalStorage } = globalConfig;

    if (configs.length > 1) {
        throw new Error('WIP - Do not support multiple projects for compare just yet...');
    }

    if (!externalStorage) {
        throw new Error('WIP - Do not support local comparison just yet. You need a --externalStorage');
    }

    const projectConfig = configs[0];
    const { projectName } = projectConfig;
    let storageProvider;
    try {
        storageProvider = require(externalStorage);
    } catch (err) {
        throw new Error(`Can't resolve the externalStorage ${externalStorage}`);
    }

    preRunMessager.print('Comparing Stats... \n', outputStream);
    await compareBenchmarkStats(baseCommit, compareCommit, projectName, storageProvider);
}
