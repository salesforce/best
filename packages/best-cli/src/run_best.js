import globby from "globby";
import { buildBenchmarks } from "best-build";
import path from "path";

async function getBenchmarkPaths(globalConfig, config) {
    const rootDir = globalConfig.rootDir;
    const { testMatch } = config;
    const results = await globby(testMatch, { cwd: rootDir });
    return results.map(p => path.resolve(rootDir, p));
}

export async function runBest(globalConfig, configs, hasDeprecationWarnings, outputStream, onComplete) {
    const matchGroups = await Promise.all(
        configs.map(async config => {
            const matches = await getBenchmarkPaths(globalConfig, config);
            return { config, matches };
        })
    );

    const built = await Promise.all(matchGroups.map(async ({ matches, config }) => buildBenchmarks(matches, config, globalConfig)));

}
