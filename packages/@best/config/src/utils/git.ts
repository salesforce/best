/*
 * Copyright (c) 2019, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: MIT
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/MIT
*/

import SimpleGit from "simple-git/promise";
import { GitConfig } from "@best/types";

// TODO: Remove this once the library fixes its types
declare module 'simple-git/promise' {
    interface SimpleGit {
        listRemote(options: string[]): Promise<string>
    }
}

async function getCurrentHashAndDate(git: SimpleGit.SimpleGit):Promise< { hash: string, date: string } > {
    const { latest } = await git.log();
    const date = latest.date;
    const hash = latest.hash.slice(0, 7);
    return { hash, date };
}

async function hasLocalChanges(git: SimpleGit.SimpleGit): Promise<boolean> {
    const diff = await git.diffSummary();
    return diff.files && diff.files.length > 0;
}

function getBranch(git: SimpleGit.SimpleGit): Promise<string> {
    return git.revparse(['--abbrev-ref', 'HEAD']);
}

async function getRepository(git: SimpleGit.SimpleGit): Promise<{ owner: string, repo: string }> {
    const url = await git.listRemote(['--get-url']);
    const matches = url.trim().match(/^.+[:/](.+)\/(.+).git$/);
    if (!matches) {
        throw new Error('Unable to parse git repo');
    }

    const [, owner, repo] = matches;
    return { owner, repo};
}

export async function getGitInfo(baseDir?: string): Promise<GitConfig | undefined> {
    const git = SimpleGit(baseDir);
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
