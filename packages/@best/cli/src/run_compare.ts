/*
 * Copyright (c) 2019, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: MIT
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/MIT
 */

import { compareBenchmarkStats } from '@best/compare';
import {
    beginBenchmarkComparisonCheck,
    completeBenchmarkComparisonCheck,
    failedBenchmarkComparisonCheck,
    updateLatestRelease,
} from '@best/github-integration';
import { runBest } from './run_best';
import git from 'simple-git/promise';
import { FrozenProjectConfig, FrozenGlobalConfig, BenchmarkComparison } from '@best/types';

const STORAGE_FS = '@best/store-fs';
const isHex = (x: string) => /^[0-9a-fA-F]+$/.test(x);
const normalizeCommit = async (commit: string, gitCLI: any) => {
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

export async function runCompare(
    globalConfig: FrozenGlobalConfig,
    configs: FrozenProjectConfig[],
    outputStream: NodeJS.WriteStream,
): Promise<BenchmarkComparison | undefined> {
    const {
        gitInfo: { localChanges },
        rootDir,
        gitIntegration,
        externalStorage,
        compareStats = [],
    } = globalConfig;
    const gitCLI = git(rootDir);
    const status = await gitCLI.status();
    const initialBranch = status.current;

    let baseCommit = compareStats[0] || 'master';
    let compareCommit = compareStats[1] || (localChanges ? 'local' : 'current');
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
        return;
    }

    let check, gitHubInstallation;
    if (gitIntegration) {
        const github = await beginBenchmarkComparisonCheck(compareCommit, globalConfig);
        check = github.check;
        gitHubInstallation = github.gitHubInstallation;
    }

    try {
        const projectNames = configs.map((cfg: any) => cfg.projectName);
        const runConfig = { ...globalConfig, gitLocalChanges: false };
        let storageProvider;

        // If not external storage we will run the benchmarks and compare using fs
        if (!externalStorage) {
            storageProvider = require(STORAGE_FS);
            storageProvider.initialize({ rootDir });
            if (localChanges) {
                await gitCLI.stash({ '--include-untracked': true });
                stashedLocalChanges = true;
            }

            // Run base commit.
            await gitCLI.checkout(baseCommit);
            await runBest(
                {
                    ...runConfig,
                    gitInfo: {
                        ...runConfig.gitInfo,
                        lastCommit: { ...runConfig.gitInfo.lastCommit, hash: baseCommit },
                    },
                },
                configs,
                outputStream,
            );

            // Run local changes or compare commit.
            if (compareCommit === 'local') {
                await gitCLI.checkout(initialBranch);
                if (stashedLocalChanges) {
                    await gitCLI.stash(['pop']);
                }
            } else {
                await gitCLI.checkout(compareCommit);
            }
            await runBest(
                {
                    ...runConfig,
                    gitInfo: {
                        ...runConfig.gitInfo,
                        lastCommit: { ...runConfig.gitInfo.lastCommit, hash: compareCommit },
                    },
                },
                configs,
                outputStream,
            );

            // Return local files to their initial state no matter what happens.
            await gitCLI.checkout(initialBranch);
            if (stashedLocalChanges) {
                await gitCLI.stash(['pop']);
            }
        } else {
            try {
                storageProvider = require(externalStorage);
                storageProvider.initialize({});
            } catch (err) {
                throw new Error(`Can't resolve the externalStorage ${externalStorage}`);
            }
        }

        const compareResults = await compareBenchmarkStats(baseCommit, compareCommit, projectNames, storageProvider);

        if (gitIntegration && gitHubInstallation && check) {
            await completeBenchmarkComparisonCheck(gitHubInstallation, check, compareResults, globalConfig);
        }

        if (gitIntegration) {
            updateLatestRelease(projectNames, globalConfig);
        }

        return compareResults;
    } catch (err) {
        if (gitIntegration && gitHubInstallation && check) {
            await failedBenchmarkComparisonCheck(gitHubInstallation, check, err.toString(), globalConfig);
        }

        throw err;
    }
}
