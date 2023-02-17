/*
 * Copyright (c) 2019, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: MIT
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/MIT
 */

import { simpleGit, SimpleGit } from 'simple-git';
import { GitConfig } from '@best/types';

async function getCurrentHashAndDate(git: SimpleGit): Promise<{ hash: string; date: string }> {
    const { latest } = await git.log();
    const date = latest!.date;
    const hash = latest!.hash.slice(0, 7);
    return { hash, date };
}

async function hasLocalChanges(git: SimpleGit): Promise<boolean> {
    const diff = await git.diffSummary();
    return diff.files && diff.files.length > 0;
}

function getBranch(git: SimpleGit): Promise<string> {
    return git.revparse(['--abbrev-ref', 'HEAD']);
}

async function getRepository(git: SimpleGit): Promise<{ owner: string; repo: string }> {
    const url = await git.listRemote(['--get-url']);
    const matches = url.trim().match(/^.+[:/](.+)\/(.+)/);
    if (!matches) {
        throw new Error('Unable to parse git repo');
    }

    const [, owner, repo] = matches;
    return { owner, repo };
}

export async function getGitInfo(baseDir?: string): Promise<GitConfig | undefined> {
    const git = simpleGit(baseDir);
    const isRepo = await git.checkIsRepo();

    if (isRepo) {
        const [lastCommit, localChanges, branch, repo] = await Promise.all([
            getCurrentHashAndDate(git),
            hasLocalChanges(git),
            getBranch(git),
            getRepository(git),
        ]);

        return { lastCommit, localChanges, branch, repo };
    }
}
