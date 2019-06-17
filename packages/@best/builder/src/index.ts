import { rollup, ModuleFormat } from 'rollup';
import path from 'path';
import benchmarkRollup from './rollup-plugin-benchmark-import';
// import { ncp } from 'ncp';
// import rimraf from 'rimraf';
// import fs from 'fs';
import crypto from 'crypto';
// import { promisify } from 'util';
import mkdirp from "mkdirp";

import { FrozenGlobalConfig, FrozenProjectConfig, ProjectConfigPlugin } from '@best/config/build/types';
import { BuildOutputStream } from "@best/console-stream/build/index"

// const deepDelete = promisify(rimraf);
// const deepCopy = promisify(ncp);

const BASE_ROLLUP_OUTPUT = {
    format: 'iife' as ModuleFormat,
};

const ROLLUP_CACHE = new Map();

function md5(data: string) {
    return crypto
        .createHash('md5')
        .update(data)
        .digest('hex');
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

    return plugins.map((plugin: any) => {
        if (typeof plugin === 'string') {
            return req(plugin)();
        } else if (Array.isArray(plugin)) {
            return req(plugin[0])(plugin[1]);
        } else {
            throw new Error('Invalid plugin config');
        }
    });
}

// function overwriteDefaultTemplate(templatePath: string, publicFolder: string) {
//     const template = fs.readFileSync(templatePath, 'utf8');
//     const templateOptions: any = {};
//     templateOptions.customTemplate = template;
//     templateOptions.publicFolder = publicFolder;
//     return templateOptions;
// }

// function wait(n: number) {
//     return new Promise((resolve) => {
//         setTimeout(() => resolve(), n);
//     });
// }

export async function buildBenchmark(entry: string, projectConfig: FrozenProjectConfig, globalConfig: FrozenGlobalConfig, buildLogStream: BuildOutputStream) {
    buildLogStream.onBenchmarkBuildStart(entry);

    const { gitInfo: { lastCommit: { hash: gitHash }, localChanges } } = globalConfig;
    const { projectName, benchmarkOutput } = projectConfig;
    const ext = path.extname(entry);
    const benchmarkName = path.basename(entry, ext);
    // const benchmarkJSFileName = benchmarkName + ext;
    const benchmarkProjectFolder = path.join(benchmarkOutput, projectName);

    const rollupInputOpts = {
        input: entry,
        plugins: [benchmarkRollup(), ...addResolverPlugins(projectConfig.plugins)],
        cache: ROLLUP_CACHE.get(projectName)
    };

    buildLogStream.log('Bundling benchmark files...');
    const bundle = await rollup(rollupInputOpts);
    ROLLUP_CACHE.set(projectName, bundle.cache);

    buildLogStream.log('Generating artifacts...');
    const rollupOutputOpts = { ...BASE_ROLLUP_OUTPUT };
    const { output } = await bundle.generate(rollupOutputOpts);
    const code = output[0].code; // We don't do code splitting so the first one will be the one we want
    const benchmarkSignature = md5(code);

    const benchmarkSnapshotName = localChanges ? `${benchmarkName}_local_${benchmarkSignature}` : `${benchmarkName}_${gitHash}`;
    const benchmarkFolder = path.join(benchmarkProjectFolder, benchmarkSnapshotName);
    const benchmarkArtifactsFolder = path.join(benchmarkFolder, 'artifacts');

    mkdirp.sync(benchmarkArtifactsFolder);

    // const htmlPath = path.resolve(path.join(benchmarkRootFolder, benchmarkName + '.html'));
    // const projectTemplatePath = path.resolve(path.join(projectConfig.rootDir, 'src', 'template.benchmark.html'));
    // const benchmarkTemplatePath = path.resolve(path.join(entry, '..', 'template.benchmark.html'));
    // const generateHTMLOptions = {
    //     benchmarkJS: `./${benchmarkJSFileName}`,
    //     benchmarkName
    // };

    // const templatePath =
    //     fs.existsSync(benchmarkTemplatePath) ? benchmarkTemplatePath :
    //         fs.existsSync(projectTemplatePath) ? projectTemplatePath :
    //             undefined;

    // if (templatePath) {
    //     Object.assign(generateHTMLOptions, overwriteDefaultTemplate(templatePath, publicFolder));
    //     const source = path.resolve(path.join(projectConfig.rootDir, "public"));
    //     await deepDelete(publicFolder);
    //     await deepCopy(source, publicFolder);
    // }

    // const html = generateDefaultHTML(generateHTMLOptions);

    // buildLogStream.log('Saving artifacts...');

    // fs.writeFileSync(htmlPath, html, 'utf8');

    // buildLogStream.onBenchmarkBuildEnd(entry);

    // return {
    //     benchmarkName,
    //     benchmarkFolder,
    //     benchmarkSignature,
    //     benchmarkEntry: htmlPath,
    //     projectConfig,
    //     globalConfig,
    // };
}

export async function buildBenchmarks(benchmarks: string[], projectConfig: FrozenProjectConfig, globalConfig: FrozenGlobalConfig, buildLogStream: BuildOutputStream) {
    const benchBuild = [];
    for (const benchmark of benchmarks) {
        const build = await buildBenchmark(benchmark, projectConfig, globalConfig, buildLogStream);
        benchBuild.push(build);
    }
    return benchBuild;
}
