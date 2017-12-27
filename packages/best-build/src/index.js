import { rollup } from "rollup";
import path from "path";
import benchmarkRollup from "./rollup-plugin-benchmark-import";

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
    const fileName = path.basename(entry);
    const inputOptions = Object.assign({}, BASE_ROLLUP_INPUT, {
        input: entry,
        plugins: [
            benchmarkRollup(),
            ...addResolverPlugins(proyectConfig),
        ]
    });

    const bundle = await rollup(inputOptions);

    const outputOptions = Object.assign({}, BASE_ROLLUP_OUTPUT, {
        file: path.join(proyectConfig.cacheDirectory, fileName)
    });

    // const { code, map } = await bundle.generate(outputOptions);
    console.log('>> Creating benchmark: ', outputOptions.file);
    return bundle.write(outputOptions);
}

export async function buildBenchmarks(tests, proyectConfig, globalConfig) {
    return Promise.all(tests.map(test => buildBenchmark(test, proyectConfig, globalConfig)));
}
