"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const PRIMITIVES = [
    'beforeAll',
    'beforeEach',
    'before',
    'afterAll',
    'afterEach',
    'after',
    'benchmark',
    'describe',
    'run',
];
function resolveModuleEntryFromPackage(module) {
    let modulePath;
    try {
        modulePath = require.resolve(`${module}/dist/index.js`);
    }
    catch (e) {
        // intentional noop
    }
    return modulePath;
}
const BENCHMARK_RUNTIME_MODULE = '@best/runtime';
const BENCHMARK_IMPORT = `import { ${PRIMITIVES.join(',')} } from "${BENCHMARK_RUNTIME_MODULE}" \n`;
function default_1() {
    let input;
    return {
        name: 'benchmark-import',
        options(rollupOpts) {
            input = rollupOpts.input;
        },
        resolveId(id) {
            if (id === BENCHMARK_RUNTIME_MODULE) {
                return resolveModuleEntryFromPackage(BENCHMARK_RUNTIME_MODULE);
            }
            return undefined;
        },
        transform(src, id) {
            if (id === input) {
                src = BENCHMARK_IMPORT + src;
            }
            return { code: src, map: null };
        },
    };
}
exports.default = default_1;
//# sourceMappingURL=rollup-plugin-benchmark-import.js.map