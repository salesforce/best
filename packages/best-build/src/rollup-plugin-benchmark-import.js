import path from "path";

const PRIMITIVES = [
    'beforeAll',
    'beforeEach',
    'before',
    'afterAll',
    'afterEach',
    'after',
    'benchmark',
    'describe',
    'run'
];

function resolveModuleEntryFromPackage(module) {
    let modulePath;
    try {
        const pkg = require(`${module}/package.json`);
        modulePath = require.resolve(path.join(module, pkg.module));
    } catch(e) {}

    return modulePath;
}

const BENCHMARK_RUNTIME_MODULE = 'best-runtime';
const BENCHMARK_IMPORT = `import { ${PRIMITIVES.join(',')} } from "${BENCHMARK_RUNTIME_MODULE}" \n`;

export default function (opts) {
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
        },
        transform(src, id) {
            if (id === input) {
                src = BENCHMARK_IMPORT + src;
            }

            return { code: src, map: null };
        }
    }
}
