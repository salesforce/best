/*
 * Copyright (c) 2019, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: MIT
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/MIT
 */

import path from 'path';
import { readConfig } from '../index';

const CONFIG_FIXTURE = path.resolve(__dirname, 'fixtures', 'best_config_js');
const CONFIG_FIXTURE_OVERRIDES = path.resolve(__dirname, 'fixtures', 'best_config_overrides_js');

describe('config file resolution', () => {
    test('throw if not config is found in the directory', async () => {
        await expect(readConfig({} as any, '/foo/bar')).rejects.toThrow('No config found in /foo/bar');
    });

    test('resolves config in best.config.js', async () => {
        const config = await readConfig({} as any, CONFIG_FIXTURE);
        expect(config.projectConfig.projectName).toBe('test');
    });

    test('resolves config in best.config.js by walking up the directory tree', async () => {
        const config = await readConfig({} as any, path.resolve(__dirname, 'fixtures', 'best_config_js', 'nested'));
        expect(config.projectConfig.projectName).toBe('test');
    });

    test('resolves config in package.json', async () => {
        const config = await readConfig({} as any, path.resolve(__dirname, 'fixtures', 'package_json'));
        expect(config.projectConfig.projectName).toBe('test');
    });

    test('throws if package.json has no best section', async () => {
        await expect(
            readConfig({} as any, path.resolve(__dirname, 'fixtures', 'best_config_js-invalid')),
        ).rejects.toThrow(/No "best" section has been found in/);
    });
});

describe('config normalization', () => {
    test('config override using argument', async () => {
        const projectName = 'name override';
        const config = await readConfig({ projectName } as any, CONFIG_FIXTURE);
        expect(config.projectConfig.projectName).toBe(projectName);
    });

    test('remapping property iteration to benchmarkIterations', async () => {
        const iterations = 100;
        const config = await readConfig({ iterations } as any, CONFIG_FIXTURE);
        expect(config.projectConfig.benchmarkIterations).toBe(iterations);
    });

    describe('mainBranch', () => {
        test('has the expected fallback', async () => {
            const config = await readConfig({} as any, CONFIG_FIXTURE);
            expect(config.globalConfig!.mainBranch).toBe('main');
        });

        test('can be configured', async () => {
            const config = await readConfig({} as any, CONFIG_FIXTURE_OVERRIDES);
            expect(config.globalConfig!.mainBranch).toBe('test-branch');
        });
    });
});
