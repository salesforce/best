import * as path from 'path';
import { readConfig, getConfigs } from '../index';

describe('readConfig', () => {
    test('throw if not config is found in the directory', async () => {
        await expect(
            readConfig({}, '/foo/bar')
        ).rejects.toThrow('No config found in /foo/bar');
    });

    test('resolves config in best.config.js', async () => {
        const config = await readConfig({}, path.resolve(__dirname, 'fixtures', 'best_config_js'));
        expect(config.projectConfig.projectName).toBe('test');
    });

    test('resolves config in package.json', async () => {
        const config = await readConfig({}, path.resolve(__dirname, 'fixtures', 'package_json'));
        expect(config.projectConfig.projectName).toBe('test');
    });

    test('throws if package.json has no best section', async () => {
        await expect(
            readConfig({}, path.resolve(__dirname, 'fixtures', 'best_config_js-invalid'))
        ).rejects.toThrow(/No "best" section has been found in/);
    });


});

// describe('getConfigs', () => {
//     test('config', async () => {
//         const config = await getConfigs([])
//         console.log(config)
//     });
// });
