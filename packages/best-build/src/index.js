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

    const pluginNames = Object.keys(plugins);
    return pluginNames.map(pluginName => {
        return require(pluginName)(plugins[pluginName]);
    });
}

export async function buildBenchmark(entry, projectConfig, globalConfig, messager) {
    messager.onBenchmarkBuildStart(entry);

    const ext = path.extname(entry);
    const benchmarkName = path.basename(entry, ext);
    const benchmarkFolder = path.join(projectConfig.cacheDirectory, benchmarkName);
    const benchmarkJSFileName = benchmarkName + ext;
    const inputOptions = Object.assign({}, BASE_ROLLUP_INPUT, {
        input: entry,
        plugins: [benchmarkRollup(), ...addResolverPlugins(projectConfig)],
    });

    const bundle = await rollup(inputOptions);
    const outputOptions = Object.assign({}, BASE_ROLLUP_OUTPUT, {
        file: path.join(benchmarkFolder, benchmarkJSFileName),
    });

    const { code } = await bundle.generate(outputOptions);
    await bundle.write(outputOptions);

    const htmlPath = path.resolve(path.join(benchmarkFolder, benchmarkName + '.html'));
    const html = generateDefaultHTML({
        benchmarkJS: `./${benchmarkJSFileName}`,
        benchmarkName,
    });
    fs.writeFileSync(htmlPath, html, 'utf8');

    messager.onBenchmarkBuildEnd(entry);

    return {
        benchmarkName,
        benchmarkFolder,
        benchmarkSignature: md5(code),
        benchmarkEntry: htmlPath,
        projectConfig,
        globalConfig,
    };
}

export async function buildBenchmarks(tests, projectConfig, globalConfig, messager) {
    return Promise.all(tests.map(test => buildBenchmark(test, projectConfig, globalConfig, messager)));
}
