import { rollup } from "rollup";
import benchmarkRollup from "./rollup-plugin-benchmark-import";
import { resolve } from "url";

const BASE_ROLLUP_INPUT = {};
const BASE_ROLLUP_OUTPUT = {
    format: 'iife'
};

function addResolverPlugins({ plugins }) {
    const pluginNames = Object.keys(plugins);
    return pluginNames.map((pluginName) => {
        return require(pluginName)(plugins[pluginName]);
    });
}

export async function buildBenmark(entry, proyectConfig, globalConfig) {
    const inputOptions = Object.assign({}, BASE_ROLLUP_INPUT, {
        input: entry,
        plugins: [
            benchmarkRollup(),
            ...addResolverPlugins(proyectConfig),
        ]
    });

    const bundle = await rollup(inputOptions);

    const outputOptions = Object.assign({}, BASE_ROLLUP_OUTPUT, {});
    const { code, map } = await bundle.generate(outputOptions);

    console.log(code);
}

export async function buildBenchmarks(tests, proyectConfig, globalConfig) {
    return buildBenmark(tests[0], proyectConfig, globalConfig);
}
