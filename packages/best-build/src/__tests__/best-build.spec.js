import * as os from 'os';
import * as fs from 'fs';
import * as path from 'path';

import { buildBenchmark } from '../index';

const TEMP_DIR_PREFIX = 'best-test-';
const MOCK_MESSAGER = {
    onBenchmarkBuildStart() {},
    onBenchmarkBuildEnd() {},
};

function tempDir() {
    return fs.mkdtempSync(path.join(os.tmpdir(), TEMP_DIR_PREFIX));
}

describe('buildBenchmark', () => {
    test('generating index.js and index.html', async () => {
        const cacheDirectory = tempDir();
        const res = await buildBenchmark(
            path.resolve(__dirname, 'fixtures', 'single-file', 'single-file.js'),
            {
                cacheDirectory,
            },
            {},
            MOCK_MESSAGER,
        );

        expect(fs.statSync(`${cacheDirectory}/single-file`).isDirectory()).toBe(true);
        expect(fs.statSync(`${cacheDirectory}/single-file/single-file.html`).isFile()).toBe(true);
        expect(fs.statSync(`${cacheDirectory}/single-file/single-file.js`).isFile()).toBe(true);
    });

    test('build output', async () => {
        const { benchmarkName, benchmarkEntry, benchmarkFolder, benchmarkSignature } = await buildBenchmark(
            path.resolve(__dirname, 'fixtures', 'single-file', 'single-file.js'),
            {
                cacheDirectory: tempDir(),
            },
            {},
            MOCK_MESSAGER,
        );

        expect(benchmarkName).toBe('single-file');
        expect(benchmarkFolder.endsWith('single-file')).toBe(true);
        expect(benchmarkEntry.endsWith('single-file/single-file.html')).toBe(true);
        expect(typeof benchmarkSignature).toBe('string');
    });

    test('calling messager before and after the build', async () => {
        const messager = {
            onBenchmarkBuildStart: jest.fn(),
            onBenchmarkBuildEnd: jest.fn(),
        };

        await buildBenchmark(
            path.resolve(__dirname, 'fixtures', 'single-file', 'single-file.js'),
            {
                cacheDirectory: tempDir(),
            },
            {},
            messager,
        );

        expect(messager.onBenchmarkBuildStart).toHaveBeenCalled();
        expect(messager.onBenchmarkBuildEnd).toHaveBeenCalled();
    });

    test('plugin receives options when required', async () => {
        expect.hasAssertions();

        const PLUGIN_OPTIONS = {
            foo: 'bar'
        };

        jest.doMock('build-plugin-opts', () => {
            return (options) => {
                expect(options).toBe(PLUGIN_OPTIONS);
                return {};
            };
        }, {
            virtual: true
        });

        await buildBenchmark(
            path.resolve(__dirname, 'fixtures', 'single-file', 'single-file.js'),
            {
                cacheDirectory: tempDir(),
                plugins: {
                    'build-plugin-opts': PLUGIN_OPTIONS
                }
            },
            {},
            MOCK_MESSAGER,
        );
    });

    test('plugin hooks into rollup lifecycle hooks', async () => {
        const entry = path.resolve(__dirname, 'fixtures', 'single-file', 'single-file.js');
        const loaded = [];
        const transformed = [];

        jest.doMock('build-plugin-hooks', () => {
            return (options) => {
                return {
                    load: (id) => { loaded.push(id) },
                    transform: (src, id) => { transformed.push(id) },
                };
            };
        }, {
            virtual: true
        });

        await buildBenchmark(
            path.resolve(__dirname, 'fixtures', 'single-file', 'single-file.js'),
            {
                cacheDirectory: tempDir(),
                plugins: {
                    'build-plugin-hooks': true
                }
            },
            {},
            MOCK_MESSAGER,
        );

        expect(loaded.some(file => file === entry)).toBe(true);
        expect(transformed.some(file => file === entry)).toBe(true);
    });
});
