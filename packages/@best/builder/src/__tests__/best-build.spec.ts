/*
 * Copyright (c) 2019, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: MIT
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/MIT
 */

import os from 'os';
import fs from 'fs';
import path from 'path';

import { buildBenchmark } from '../build-benchmark';

const GLOBAL_CONFIG = {
    gitInfo: {
        lastCommit: { hash: 'commit-hash-asdf' },
        localChanges: false,
        gitBranch: 'test',
        repo: { owner: 'salesforce', repo: 'best' },
    },
};

const TEMP_DIR_PREFIX = 'best-test-';
const ROOT_DIR_PREFIX = 'best-root-test-';
const MOCK_MESSAGER = {
    onBenchmarkBuildStart() {},
    onBenchmarkBuildEnd() {},
    log() {},
};
const projectName = 'test';
const rootDir = roorDir();

function tempDir() {
    return fs.mkdtempSync(path.join(os.tmpdir(), TEMP_DIR_PREFIX));
}

function roorDir() {
    return fs.mkdtempSync(path.join(os.tmpdir(), ROOT_DIR_PREFIX));
}

describe('buildBenchmark', () => {
    test('generating index.js and index.html', async () => {
        const benchmarkOutput = tempDir();
        const hash = GLOBAL_CONFIG.gitInfo.lastCommit.hash;
        await buildBenchmark(
            path.resolve(__dirname, 'fixtures', 'single-file', 'single-file.js'),
            {
                benchmarkOutput,
                projectName,
                rootDir,
            },
            GLOBAL_CONFIG,
            MOCK_MESSAGER,
        );

        expect(fs.statSync(`${benchmarkOutput}/${projectName}/single-file_${hash}/artifacts`).isDirectory()).toBe(true);
        expect(
            fs.statSync(`${benchmarkOutput}/${projectName}/single-file_${hash}/artifacts/single-file.html`).isFile(),
        ).toBe(true);
        expect(
            fs.statSync(`${benchmarkOutput}/${projectName}/single-file_${hash}/artifacts/single-file.js`).isFile(),
        ).toBe(true);
    });

    test('build output', async () => {
        const hash = GLOBAL_CONFIG.gitInfo.lastCommit.hash;
        const { benchmarkName, benchmarkEntry, benchmarkFolder, benchmarkSignature } = await buildBenchmark(
            path.resolve(__dirname, 'fixtures', 'single-file', 'single-file.js'),
            {
                benchmarkOutput: tempDir(),
                projectName,
                rootDir,
            },
            GLOBAL_CONFIG,
            MOCK_MESSAGER,
        );

        expect(benchmarkName).toBe('single-file');
        expect(benchmarkFolder.endsWith(`single-file_${hash}`)).toBe(true);
        expect(fs.existsSync(benchmarkFolder)).toBe(true);
        expect(benchmarkEntry.endsWith(`single-file_${hash}/artifacts/single-file.html`)).toBe(true);
        expect(fs.existsSync(benchmarkEntry)).toBe(true);
        expect(typeof benchmarkSignature).toBe('string');
    });

    test('calling messager before and after the build', async () => {
        const messager = {
            onBenchmarkBuildStart: jest.fn(),
            onBenchmarkBuildEnd: jest.fn(),
            log: jest.fn,
        };

        await buildBenchmark(
            path.resolve(__dirname, 'fixtures', 'single-file', 'single-file.js'),
            {
                benchmarkOutput: tempDir(),
                projectName,
                rootDir,
            },
            GLOBAL_CONFIG,
            messager,
        );

        expect(messager.onBenchmarkBuildStart).toHaveBeenCalled();
        expect(messager.onBenchmarkBuildEnd).toHaveBeenCalled();
    });

    test('plugin receives options when required', async () => {
        expect.hasAssertions();

        const PLUGIN_OPTIONS = {
            foo: 'bar',
        };

        jest.doMock(
            'build-plugin-opts',
            () => {
                return (options) => {
                    expect(options).toBe(PLUGIN_OPTIONS);
                    return {};
                };
            },
            {
                virtual: true,
            },
        );

        await buildBenchmark(
            path.resolve(__dirname, 'fixtures', 'single-file', 'single-file.js'),
            {
                benchmarkOutput: tempDir(),
                projectName,
                plugins: [['build-plugin-opts', PLUGIN_OPTIONS]],
                rootDir,
            },
            GLOBAL_CONFIG,
            MOCK_MESSAGER,
        );
    });

    test('plugin hooks into rollup lifecycle hooks', async () => {
        const entry = path.resolve(__dirname, 'fixtures', 'single-file', 'single-file.js');
        const loaded = [];
        const transformed = [];

        jest.doMock(
            'build-plugin-hooks',
            () => {
                return () => {
                    return {
                        load(id) {
                            if (id.endsWith('single-file.js')) {
                                loaded.push(id);
                                return '/* empty */';
                            }
                        },
                        transform(src, id) {
                            transformed.push(id);
                            return src;
                        },
                    };
                };
            },
            {
                virtual: true,
            },
        );

        await buildBenchmark(
            path.resolve(__dirname, 'fixtures', 'single-file', 'single-file.js'),
            {
                benchmarkOutput: tempDir(),
                projectName,
                plugins: ['build-plugin-hooks'],
                rootDir,
            },
            GLOBAL_CONFIG,
            MOCK_MESSAGER,
        );

        expect(loaded.some((file) => file === entry)).toBe(true);
        expect(transformed.some((file) => file === entry)).toBe(true);
    });

    test(`throw if bare module specifiers can't be resolved`, async () => {
        await expect(() =>
            buildBenchmark(
                path.resolve(__dirname, 'fixtures', 'error-missing-external', 'error-missing-external.js'),
                {
                    benchmarkOutput: tempDir(),
                    projectName,
                    rootDir,
                },
                GLOBAL_CONFIG,
                MOCK_MESSAGER,
            ),
        ).rejects.toHaveProperty(
            'message',
            expect.stringMatching(
                /"x\/missing" is imported by .*, but could not be resolved – treating it as an external dependency./,
            ),
        );
    });
});
