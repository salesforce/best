import {InputOption, RollupOptions} from "rollup";

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

function resolveModuleEntryFromPackage(module: string) {
    let modulePath;
    try {
        modulePath = require.resolve(`${module}/dist/index.js`);
    } catch (e) {
        // intentional noop
    }

    return modulePath;
}

const BENCHMARK_RUNTIME_MODULE = '@best/runtime';
const BENCHMARK_IMPORT = `import { ${PRIMITIVES.join(',')} } from "${BENCHMARK_RUNTIME_MODULE}" \n`;

export default function () {
    let input: InputOption | undefined;
    return {
        name: 'benchmark-import',
        options(rollupOpts: RollupOptions) {
            input = rollupOpts.input;
        },
        resolveId(id: string) {
            if (id === BENCHMARK_RUNTIME_MODULE) {
                return resolveModuleEntryFromPackage(BENCHMARK_RUNTIME_MODULE);
            }
            return undefined;
        },
        transform(src: string, id: string) {
            if (id === input) {
                src = BENCHMARK_IMPORT + src;
            }

            return { code: src, map: null };
        },
    };
}
