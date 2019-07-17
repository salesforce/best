const path = require('path');
const { rollup } = require('rollup');
const lwcPlugin = require('@lwc/rollup-plugin');
const kebabToCamelCase = require('./utilKebabToCamelCase');
const { DIST_DIR, LWC_COMPILER_CONFIG } = require('../config');
const PAGE_CMP_PREFIX = 'page-docs';

function generateWebComponentRegistration(customElementName) {
    const moduleName = kebabToCamelCase(customElementName);
    const Ctor = moduleName.replace('/', '$');
    return [
        `import ${Ctor} from "${moduleName}";`,
        `customElements.define("${customElementName}", buildCustomElementConstructor(${Ctor}));`,
        '',
    ].join('\n');
}

function syntheticPagePlugin({ pageDoc }) {
    const { components } = pageDoc;
    const webComponentBoot = components.map(generateWebComponentRegistration).join('');

    return {
        resolveId(id) {
            if (id.startsWith(PAGE_CMP_PREFIX)) {
                return id;
            }
        },
        load(id) {
            if (id.startsWith(PAGE_CMP_PREFIX)) {
                return `
                    import { buildCustomElementConstructor } from "lwc";
                    ${webComponentBoot}
                `;
            }
        },
    };
}

module.exports = async function buildWebComponents(pageDoc, { modulesDir }) {
    const { docName, components } = pageDoc;
    if (!components || components.length === 0) {
        return [];
    }

    const rollupBundler = await rollup({
        input: `${PAGE_CMP_PREFIX}-${docName}.js`,
        external: ['lwc', '/assets/js/lwc/compiler.js'],
        plugins: [
            syntheticPagePlugin({ pageDoc }),
            lwcPlugin({
                ...LWC_COMPILER_CONFIG,
                rootDir: modulesDir,
            }),
        ],
        chunkGroupingSize: 20,
        experimentalOptimizeChunks: true,
    });

    const results = await rollupBundler.write({
        dir: path.resolve(DIST_DIR, 'assets/js'),
        format: 'iife',
        globals: { lwc: 'Engine' },
        entryFileNames: '[name]-[hash].js',
        chunkFileNames: '[name]-[hash].js',
        sourcemap: false,
    });

    return results.output.map(r => r.fileName);
};
