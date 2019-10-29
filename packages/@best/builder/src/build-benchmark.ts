/*
 * Copyright (c) 2019, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: MIT
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/MIT
*/

import fs from 'fs';
import { rollup, ModuleFormat } from 'rollup';
import path from 'path';
import crypto from 'crypto';
import mkdirp from "mkdirp";
import benchmarkRollup from './rollup-plugin-benchmark-import';
import generateHtml from './html-templating';
import { FrozenGlobalConfig, FrozenProjectConfig, ProjectConfigPlugin, BuildConfig } from '@best/types';

const BASE_ROLLUP_OUTPUT = { format: 'iife' as ModuleFormat };
const ROLLUP_CACHE = new Map();

function md5(data: string) {
    return crypto.createHash('md5').update(data).digest('hex');
}

// Handles default exports for both ES5 and ES6 syntax
function req(id: string) {
    const r = require(id);
    return r.default || r;
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
    const { projectName, benchmarkOutput, rootDir } = projectConfig;
    const ext = path.extname(entry);
    const benchmarkName = path.basename(entry, ext);
    const benchmarkJSFileName = benchmarkName + ext;
    const benchmarkProjectFolder = path.join(benchmarkOutput, projectName);

    const rollupInputOpts = {
        input: entry,
        plugins: [benchmarkRollup(), ...addResolverPlugins(projectConfig.plugins)],
        cache: ROLLUP_CACHE.get(projectName),
        manualChunks: function () { /* guarantee one chunk */ return 'main_chunk'; }
    };

    buildLogStream.log('Bundling benchmark files...');
    const bundle = await rollup(rollupInputOpts);
    ROLLUP_CACHE.set(projectName, bundle.cache);

    buildLogStream.log('Generating benchmark artifacts...');
    const rollupOutputOpts = { ...BASE_ROLLUP_OUTPUT };
    const { output } = await bundle.generate(rollupOutputOpts);
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
        benchmarkFolder: path.relative(rootDir, benchmarkFolder),
        benchmarkEntry: path.relative(rootDir, benchmarkEntry),
        benchmarkSignature,
        projectConfig,
        globalConfig,
    };
}
