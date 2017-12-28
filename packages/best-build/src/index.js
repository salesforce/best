import { rollup } from "rollup";
import path from "path";
import benchmarkRollup from "./rollup-plugin-benchmark-import";
import { generateDefaultHTML } from "./html-templating";
import fs from "fs";

const BASE_ROLLUP_INPUT = {};
const BASE_ROLLUP_OUTPUT = {
    format: 'iife'
};

function addResolverPlugins({ plugins }) {
    if (!plugins) {
        return [];
    }

    const pluginNames = Object.keys(plugins);
    return pluginNames.map((pluginName) => {
        return require(pluginName)(plugins[pluginName]);
    });
}

export async function buildBenchmark(entry, proyectConfig, globalConfig) {
    const ext = path.extname(entry);
    const benchmarkName = path.basename(entry, ext);
    const tmpFolder = path.join(proyectConfig.cacheDirectory, benchmarkName);
    const benchmarkJSFileName = benchmarkName + ext;

    const inputOptions = Object.assign({}, BASE_ROLLUP_INPUT, {
        input: entry,
        plugins: [
            benchmarkRollup(),
            ...addResolverPlugins(proyectConfig),
        ]
    });

    const bundle = await rollup(inputOptions);

    const outputOptions = Object.assign({}, BASE_ROLLUP_OUTPUT, {
        file: path.join(tmpFolder, benchmarkJSFileName)
    });

    // const { code, map } = await bundle.generate(outputOptions);
    console.log(`- Creating benchmark: ${benchmarkName} \n  >> ${tmpFolder}`);
    await bundle.write(outputOptions);

    const html = generateDefaultHTML({ benchmarkJS : `./${benchmarkJSFileName}`, benchmarkName });

    fs.writeFileSync(path.resolve(path.join(tmpFolder, benchmarkName + '.html')), html, 'utf8');

    return {
        benchmarkName: benchmarkName,
        benchmarkFolder : tmpFolder,
        proyectConfig,
        globalConfig
    };
}

export async function buildBenchmarks(tests, proyectConfig, globalConfig) {
    return Promise.all(tests.map(test => buildBenchmark(test, proyectConfig, globalConfig)));
}
