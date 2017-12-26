const PRIMITIVES = [
    'beforeAll',
    'beforeEach',
    'before',
    'afterAll',
    'afterEach',
    'after',
    'benchmark',
    'describe',
];
const BENCHMARK_IMPORT = `import { ${PRIMITIVES.join(',')} } from "benchmark-runtime" \n`;

export default function (opts) {
    let input;
    return {
        name: 'benchmark-import',
        options(rollupOpts) {
            input = rollupOpts.input;
        },
        transform(src, id) {
            if (id === input) {
                src = BENCHMARK_IMPORT + src;
            }

            return { code: src, map: null };
        }
    }
}
