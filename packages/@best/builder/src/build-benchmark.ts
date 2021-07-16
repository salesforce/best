/*
 * Copyright (c) 2019, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: MIT
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/MIT
*/

import fs from 'fs';
import { rollup, OutputOptions } from 'rollup';
import path from 'path';
import crypto from 'crypto';
import mkdirp from "mkdirp";
import benchmarkRollup from './rollup-plugin-benchmark-import';
import generateHtml from './html-templating';
import { FrozenGlobalConfig, FrozenProjectConfig, ProjectConfigPlugin, BuildConfig } from '@best/types';
import { req } from '@best/utils';

const BASE_ROLLUP_OUTPUT: OutputOptions = { format: 'iife' };
const ROLLUP_CACHE = new Map();

function md5(data: string) {
    return crypto.createHash('md5').update(data).digest('hex');
}

function addResolverPlugins(plugins: ProjectConfigPlugin[]): any[] {
    if (!plugins) {
        return [];
    }

    return plugins.map((plugin: ProjectConfigPlugin) => {
        if (typeof plugin === 'string') {
            return req(plugin)();
        } else if (Array.isArray(plugin)) {
            return req(plugin[0])(plugin[1]);
        } else {
            throw new Error('Invalid plugin config');
        }
    });
}

interface BuildOutputMessager {
    onBenchmarkBuildStart(benchmarkPath: string): void;
    onBenchmarkBuildEnd(benchmarkPath: string): void;
    log(message: string): void;
}

export async function buildBenchmark(entry: string, projectConfig: FrozenProjectConfig, globalConfig: FrozenGlobalConfig, buildLogStream: BuildOutputMessager): Promise<BuildConfig> {
    buildLogStream.onBenchmarkBuildStart(entry);

    const { gitInfo: { lastCommit: { hash: gitHash }, localChanges } } = globalConfig;
    const { projectName, benchmarkOutput } = projectConfig;
    const ext = path.extname(entry);
    const benchmarkName = path.basename(entry, ext);
    const benchmarkJSFileName = benchmarkName + ext;
    const benchmarkProjectFolder = path.join(benchmarkOutput, projectName);

    buildLogStream.log('Bundling benchmark files...');
    const bundle = await rollup({
        input: entry,
        plugins: [benchmarkRollup(), ...addResolverPlugins(projectConfig.plugins)],
        cache: ROLLUP_CACHE.get(projectName),
        manualChunks: function () { /* guarantee one chunk */ return 'main_chunk'; },
        onwarn(warning, warn) {
            // Make compilation fail, if any bare module can't be resolved.
            if (typeof warning === 'object' && warning.code === 'UNRESOLVED_IMPORT') {
                throw new Error(warning.message);
            }

            warn(warning);
        }
    });
    ROLLUP_CACHE.set(projectName, bundle.cache);

    buildLogStream.log('Generating benchmark artifacts...');
    const { output } = await bundle.generate(BASE_ROLLUP_OUTPUT);
    const benchmarkSource = output[0].code; // We don't do code splitting so the first one will be the one we want

    // Benchmark artifacts vars
    const benchmarkSignature = md5(benchmarkSource);
    const benchmarkSnapshotName = localChanges ? `${benchmarkName}_local_${benchmarkSignature.slice(0, 10)}` : `${benchmarkName}_${gitHash}`;
    const benchmarkFolder = path.join(benchmarkProjectFolder, benchmarkSnapshotName);
    const benchmarkArtifactsFolder = path.join(benchmarkFolder, 'artifacts');
    const benchmarkEntry = path.join(benchmarkArtifactsFolder, `${benchmarkName}.html`);
    const htmlTemplate = generateHtml({ benchmarkName, benchmarkJs: `./${benchmarkJSFileName}` });

    mkdirp.sync(benchmarkArtifactsFolder);
    fs.writeFileSync(benchmarkEntry, htmlTemplate, 'utf-8');
    fs.writeFileSync(path.join(benchmarkArtifactsFolder, benchmarkJSFileName), benchmarkSource, 'utf-8');

    buildLogStream.onBenchmarkBuildEnd(entry);

    return {
        benchmarkName,
        benchmarkFolder,
        benchmarkEntry,
        benchmarkSignature,
        projectConfig,
        globalConfig,
    };
}
