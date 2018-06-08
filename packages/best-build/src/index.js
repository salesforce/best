import { rollup } from 'rollup';
import path from 'path';
import benchmarkRollup from './rollup-plugin-benchmark-import';
import { generateDefaultHTML } from './html-templating';
import { ncp } from 'ncp';
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

// Handles default exports for both ES5 and ES6 syntax
function req(id) {
    const r = require(id);
    return r.default || r;
}

function addResolverPlugins({ plugins }) {
    if (!plugins) {
        return [];
    }

    return plugins.map((plugin) => {
        if (typeof plugin === 'string') {
            return req(plugin)();
        } else if (Array.isArray(plugin)) {
            return req(plugin[0])(plugin[1]);
        }

        return [];
    });
}

function copyFolder(source, destination) {
    return new Promise((resolve, reject) => {
        ncp(source, destination, err => {
            if (err) {
                reject(err);
            } else {
                resolve();
            }
        });
    });
}

function overwriteDefaultTemplate(templatePath, rootDir, publicFolder) {
    const customTemplate = fs.readFileSync(templatePath, 'utf8');
    const templateOptions = { customTemplate, publicFolder };
    return templateOptions;
}

export async function buildBenchmark(entry, projectConfig, globalConfig, messager) {
    const { projectName, cacheDirectory, staticFiles } = projectConfig;
    messager.onBenchmarkBuildStart(entry, projectName);

    const ext = path.extname(entry);
    const benchmarkName = path.basename(entry, ext);
    const publicFolder = path.join(cacheDirectory, projectName, "public");
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
    const projectTemplatePath = path.resolve(path.join(projectConfig.rootDir, 'src', 'template.benchmark.html'));
    const benchmarkTemplatePath = path.resolve(path.join(entry, '..', 'template.benchmark.html'));
    const generateHTMLOptions = {
        benchmarkJS: `./${benchmarkJSFileName}`,
        benchmarkName
    };

    if (fs.existsSync(benchmarkTemplatePath)) {
        Object.assign(generateHTMLOptions, overwriteDefaultTemplate(benchmarkTemplatePath, projectConfig.rootDir, publicFolder));
        await copyFolder(path.resolve(path.join(projectConfig.rootDir, "public")), publicFolder);
    } else if (fs.existsSync(projectTemplatePath)) {
        Object.assign(generateHTMLOptions, overwriteDefaultTemplate(projectTemplatePath, projectConfig.rootDir, publicFolder));
        await copyFolder(path.resolve(path.join(projectConfig.rootDir, "public")), publicFolder);
    }

    const html = generateDefaultHTML(generateHTMLOptions);

    messager.logState('Saving artifacts...');

    fs.writeFileSync(htmlPath, html, 'utf8');

    Object.keys(staticFiles || {}).forEach(async (key) => {
        const dest = path.join(benchmarkFolder, key);
        const source = staticFiles[key];
        await copyFolder(source, dest);
    });

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
