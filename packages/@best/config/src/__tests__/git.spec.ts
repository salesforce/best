/*
 * Copyright (c) 2019, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: MIT
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/MIT
 */

import { getGitInfo } from '../utils/git';

describe('config file resolution', () => {
    test('throw if not config is found in the directory', async () => {
        const gitInfo = await getGitInfo(process.cwd());
        expect(gitInfo).toBeDefined();
        expect(gitInfo.repo).toBeDefined();
    });
});
