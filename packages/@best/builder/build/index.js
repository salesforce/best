"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const rollup_1 = require("rollup");
const path_1 = __importDefault(require("path"));
const rollup_plugin_benchmark_import_1 = __importDefault(require("./rollup-plugin-benchmark-import"));
const html_templating_1 = require("./html-templating");
const ncp_1 = require("ncp");
const rimraf_1 = __importDefault(require("rimraf"));
const fs_1 = __importDefault(require("fs"));
const crypto_1 = __importDefault(require("crypto"));
const util_1 = require("util");
const deepDelete = util_1.promisify(rimraf_1.default);
const deepCopy = util_1.promisify(ncp_1.ncp);
const BASE_ROLLUP_INPUT = {};
const BASE_ROLLUP_OUTPUT = {
    format: 'iife',
};
const ROLLUP_CACHE = new Map();
function md5(data) {
    return crypto_1.default
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
        }
        else if (Array.isArray(plugin)) {
            return req(plugin[0])(plugin[1]);
        }
        return [];
    });
}
function overwriteDefaultTemplate(templatePath, publicFolder) {
    const template = fs_1.default.readFileSync(templatePath, 'utf8');
    const templateOptions = {};
    templateOptions.customTemplate = template;
    templateOptions.publicFolder = publicFolder;
    return templateOptions;
}
async function buildBenchmark(entry, projectConfig, globalConfig, messager) {
    const { projectName, cacheDirectory } = projectConfig;
    messager.onBenchmarkBuildStart(entry, projectName);
    const ext = path_1.default.extname(entry);
    const benchmarkName = path_1.default.basename(entry, ext);
    const publicFolder = path_1.default.join(cacheDirectory, projectName, "public");
    const benchmarkFolder = path_1.default.join(cacheDirectory, projectName, benchmarkName);
    const benchmarkJSFileName = benchmarkName + ext;
    const inputOptions = Object.assign({}, BASE_ROLLUP_INPUT, {
        input: entry,
        plugins: [rollup_plugin_benchmark_import_1.default(), ...addResolverPlugins(projectConfig)],
        cache: ROLLUP_CACHE.get(projectName)
    });
    messager.logState('Bundling benchmark files...');
    const bundle = await rollup_1.rollup(inputOptions);
    ROLLUP_CACHE.set(projectName, bundle.cache);
    const outputOptions = Object.assign({}, BASE_ROLLUP_OUTPUT, {
        file: path_1.default.join(benchmarkFolder, benchmarkJSFileName),
    });
    messager.logState('Generating artifacts...');
    const { code } = await bundle.generate(outputOptions);
    await bundle.write(outputOptions);
    const htmlPath = path_1.default.resolve(path_1.default.join(benchmarkFolder, benchmarkName + '.html'));
    const projectTemplatePath = path_1.default.resolve(path_1.default.join(projectConfig.rootDir, 'src', 'template.benchmark.html'));
    const benchmarkTemplatePath = path_1.default.resolve(path_1.default.join(entry, '..', 'template.benchmark.html'));
    const generateHTMLOptions = {
        benchmarkJS: `./${benchmarkJSFileName}`,
        benchmarkName
    };
    const templatePath = fs_1.default.existsSync(benchmarkTemplatePath) ? benchmarkTemplatePath :
        fs_1.default.existsSync(projectTemplatePath) ? projectTemplatePath :
            undefined;
    if (templatePath) {
        Object.assign(generateHTMLOptions, overwriteDefaultTemplate(templatePath, publicFolder));
        const source = path_1.default.resolve(path_1.default.join(projectConfig.rootDir, "public"));
        await deepDelete(publicFolder);
        await deepCopy(source, publicFolder);
    }
    const html = html_templating_1.generateDefaultHTML(generateHTMLOptions);
    messager.logState('Saving artifacts...');
    fs_1.default.writeFileSync(htmlPath, html, 'utf8');
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
exports.buildBenchmark = buildBenchmark;
async function buildBenchmarks(benchmarks, projectConfig, globalConfig, messager) {
    const benchBuild = [];
    for (const benchmark of benchmarks) {
        const build = await buildBenchmark(benchmark, projectConfig, globalConfig, messager);
        benchBuild.push(build);
    }
    return benchBuild;
}
exports.buildBenchmarks = buildBenchmarks;
//# sourceMappingURL=index.js.map