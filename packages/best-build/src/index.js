import { rollup } from 'rollup';
import path from 'path';
import benchmarkRollup from './rollup-plugin-benchmark-import';
import { generateDefaultHTML } from './html-templating';
import fs from 'fs';
import crypto from 'crypto';

const BASE_ROLLUP_INPUT = {};
const BASE_ROLLUP_OUTPUT = {
    format: 'iife',
};

function md5(data) {
    return crypto
        .createHash('md5')
        .update(data)
        .digest('hex');
}

function addResolverPlugins({ plugins }) {
    if (!plugins) {
        return [];
    }

    return plugins.map((plugin) => {
        if (typeof plugin === 'string') {
            return require(plugin)();
        } else if (Array.isArray(plugin)) {
            return require(plugin[0])(plugin[1]);
        }

        return [];
    });
}

export async function buildBenchmark(entry, projectConfig, globalConfig, messager) {
    const { projectName, cacheDirectory } = projectConfig;
    messager.onBenchmarkBuildStart(entry, projectName);

    const ext = path.extname(entry);
    const benchmarkName = path.basename(entry, ext);
    const benchmarkFolder = path.join(cacheDirectory, projectName, benchmarkName);
    const benchmarkJSFileName = benchmarkName + ext;
    const inputOptions = Object.assign({}, BASE_ROLLUP_INPUT, {
        input: entry,
        plugins: [benchmarkRollup(), ...addResolverPlugins(projectConfig)],
    });

    messager.logState('Bundling benchmark files...');

    const bundle = await rollup(inputOptions);
    const outputOptions = Object.assign({}, BASE_ROLLUP_OUTPUT, {
        file: path.join(benchmarkFolder, benchmarkJSFileName),
    });

    messager.logState('Generating artifacts...');

    const { code } = await bundle.generate(outputOptions);
    await bundle.write(outputOptions);

    const htmlPath = path.resolve(path.join(benchmarkFolder, benchmarkName + '.html'));
    const html = generateDefaultHTML({
        benchmarkJS: `./${benchmarkJSFileName}`,
        benchmarkName,
    });

    messager.logState('Saving artifacts...');

    fs.writeFileSync(htmlPath, html, 'utf8');

    messager.onBenchmarkBuildEnd(entry, projectName);

    return {
        benchmarkName,
        benchmarkFolder,
        benchmarkSignature: md5(code),
        benchmarkEntry: htmlPath,
        projectConfig,
        globalConfig,
    };
}

export async function buildBenchmarks(benchmarks, projectConfig, globalConfig, messager) {
    const benchBuild = [];
    for (const benchmark of benchmarks) {
        const build = await buildBenchmark(benchmark, projectConfig, globalConfig, messager);
        benchBuild.push(build);
    }
    return benchBuild;
}
