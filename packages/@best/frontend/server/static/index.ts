/*
 * Copyright (c) 2019, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: MIT
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/MIT
*/

import path from 'path'
import fs from 'fs'
import { promisify } from 'util'
import { rollup } from 'rollup'
import { BenchmarkResultsSnapshot, FrozenGlobalConfig, FrozenProjectConfig } from '@best/types';
import { OutputStream } from '@best/console-stream';

import { buildRollupConfig } from './rollup.config'
import html from './static-template.html'

const asyncWrite = promisify(fs.writeFile);

export const buildStaticFrontend = async (results: BenchmarkResultsSnapshot[], globalConfig: FrozenGlobalConfig, projectConfig: FrozenProjectConfig, stream: NodeJS.WriteStream): Promise<boolean> => {
    if (! globalConfig.apiDatabase) { throw new Error('No database configured') }

    const outputStream = new OutputStream(stream, globalConfig.isInteractive);

    outputStream.writeln('Beginning to generate static HTML...');

    const projectNames = results.map((res): string => res.projectConfig.projectName);

    const options = {
        projectNames,
        timingOptions: ['all', '2-months', 'last-release'],
        config: { apiDatabase: globalConfig.apiDatabase }
    }

    const rollupConfig = buildRollupConfig(projectConfig);

    try {
        const build = await rollup(rollupConfig.inputOptions(options));
        await build.generate(rollupConfig.outputOptions());
        await build.write(rollupConfig.outputOptions());

        const distDir = path.resolve(projectConfig.benchmarkOutput, 'static');

        const indexPath = path.resolve(distDir, 'index.html');
        await asyncWrite(indexPath, html);

        outputStream.writeln(`Done generating static, URL: ${indexPath}`);
    } catch (err) {
        outputStream.writeln('Error while trying to generate static HTML.');
        return false;
    }

    return true;
}