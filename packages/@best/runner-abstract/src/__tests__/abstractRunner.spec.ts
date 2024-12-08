/*
 * Copyright (c) 2019, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: MIT
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/MIT
 */
import { existsSync } from 'fs';
import express from 'express';
import {
    BuildConfig,
    FrozenProjectConfig,
    FrozenGlobalConfig,
    RunnerStream,
    Interruption,
    BenchmarkResultsSnapshot,
} from '@best/types';
import AbstractRunner from '..';

interface Server {
    address: jest.Mock;
    close: jest.Mock;
}

interface Express {
    use: jest.Mock;
    listen: jest.Mock;
}

interface TestCache {
    app: Express;
    server?: Server;

    reset: () => void;
}

jest.mock('express', () => {
    class MockServer {
        address = jest.fn(() => ({ port: 28080 }));

        close = jest.fn();
    }

    class MockExpress {
        use = jest.fn();

        listen = jest.fn((callback: Function) => {
            Promise.resolve().then(callback as any);
            return (testCache.server = testCache.server || new MockServer());
        });
    }

    const testCache: {
        server?: Server;
        app?: Express;
        reset: () => void;
    } = {
        reset: () => {
            testCache.server = undefined;
            testCache.app = undefined;
        },
    };

    const express = () => (testCache.app = testCache.app || new MockExpress());
    express.static = jest.fn((path) => path);
    express.__test__ = testCache;
    return express;
});

jest.mock('fs', () => {
    const fs = jest.requireActual('fs');
    return {
        ...fs,
        existsSync: jest.fn(fs.existsSync),
    };
});

class TestRunner extends AbstractRunner {
    run = jest.fn(
        async (
            benchmarkBuilds: BuildConfig[],
            projectConfig: FrozenProjectConfig,
            globalConfig: FrozenGlobalConfig,
            runnerLogStream: RunnerStream,
            interruption?: Interruption,
        ): Promise<BenchmarkResultsSnapshot[]> => {
            for (const benchmarkInfo of benchmarkBuilds) {
                const { benchmarkEntry, benchmarkRemoteEntry } = benchmarkInfo;
                await this.initializeServer(benchmarkRemoteEntry || benchmarkEntry, projectConfig);
            }

            return [];
        },
    );
}

const { __test__ }: { __test__: TestCache } = express as any;

beforeEach(() => __test__.reset());

describe('AbstractRunner', () => {
    describe('initializeServer()', () => {
        const benchmarkEntry = 'testFolder/testEntry';
        const assetPath = 'some/asset/path';

        let runner: TestRunner;

        beforeEach(() => {
            runner = new TestRunner();
            (existsSync as jest.Mock).mockImplementation(jest.requireActual('fs').existsSync);
        });

        it('returns a file: URI if not using http', async () => {
            const projectConfig: FrozenProjectConfig = <FrozenProjectConfig>(<Partial<FrozenProjectConfig>>{
                projectName: 'test',
                useHttp: false,
            });
            const result = await runner.initializeServer(benchmarkEntry, projectConfig);
            expect(result).toStrictEqual({ terminate: expect.any(Function), url: `file://${benchmarkEntry}` });
        });

        it('returns a http: URI when using http', async () => {
            const projectConfig: FrozenProjectConfig = <FrozenProjectConfig>(<Partial<FrozenProjectConfig>>{
                projectName: 'test',
                useHttp: true,
            });

            const result = await runner.initializeServer(benchmarkEntry, projectConfig);
            expect(result).toStrictEqual({ terminate: expect.any(Function), url: `http://127.0.0.1:28080/testEntry` });
        });

        it('serves assets', async () => {
            const projectConfig: FrozenProjectConfig = <FrozenProjectConfig>(<Partial<FrozenProjectConfig>>{
                projectName: 'test',
                useHttp: true,
                assets: [{ path: assetPath }],
            });

            (existsSync as jest.Mock).mockReturnValue(true);
            const result = await runner.initializeServer(benchmarkEntry, projectConfig);
            expect(__test__.app.use).toHaveBeenNthCalledWith(2, 'testFolder');
            expect(__test__.app.use).toHaveBeenNthCalledWith(3, assetPath);
            expect(result).toStrictEqual({ terminate: expect.any(Function), url: `http://127.0.0.1:28080/testEntry` });
        });

        it('serves aliased assets', async () => {
            const projectConfig: FrozenProjectConfig = <FrozenProjectConfig>(<Partial<FrozenProjectConfig>>{
                projectName: 'test',
                useHttp: true,
                assets: [{ alias: 'testAlias', path: assetPath }],
            });

            (existsSync as jest.Mock).mockReturnValue(true);
            const result = await runner.initializeServer(benchmarkEntry, projectConfig);
            expect(__test__.app.use).toHaveBeenNthCalledWith(2, 'testFolder');
            expect(__test__.app.use).toHaveBeenNthCalledWith(3, '/testAlias', assetPath);
            expect(result).toStrictEqual({ terminate: expect.any(Function), url: `http://127.0.0.1:28080/testEntry` });
        });

        it('throws an error for invalid asset paths', async () => {
            const projectConfig: FrozenProjectConfig = <FrozenProjectConfig>(<Partial<FrozenProjectConfig>>{
                projectName: 'test',
                useHttp: true,
                assets: [{}],
            });

            expect(() => runner.initializeServer(benchmarkEntry, projectConfig)).rejects.toThrowError(
                `Invalid asset path: '${undefined}'`,
            );
        });

        it('throws an error for missing asset paths', async () => {
            const path = '/path/does/not/exist';
            const projectConfig: FrozenProjectConfig = <FrozenProjectConfig>(<Partial<FrozenProjectConfig>>{
                projectName: 'test',
                useHttp: true,
                assets: [{ path }],
            });

            expect(() => runner.initializeServer(benchmarkEntry, projectConfig)).rejects.toThrowError(
                `Invalid asset path: '${path}'`,
            );
        });
    });
});
