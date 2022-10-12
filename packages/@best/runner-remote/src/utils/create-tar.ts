/*
 * Copyright (c) 2019, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: MIT
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/MIT
 */

import path from 'path';
import fs from 'fs';
import { c as createTar } from 'tar';

// Matches *.tgz files.
const tarballRegExp = /\.tgz$/;

export async function createTarBundle(artifactsFolder: string, benchmarkName: string) {
    return createTar(
        {
            gzip: true,
            cwd: artifactsFolder,
            noDirRecurse: true,
            filter: (p: string) => !tarballRegExp.test(p),
            file: path.resolve(artifactsFolder, `${benchmarkName}.tgz`),
        },
        fs.readdirSync(artifactsFolder),
    );
}
