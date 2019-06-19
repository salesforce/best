import path from 'path'
import fs from 'fs'
import { promisify } from 'util'
import { rollup } from 'rollup'

import rollupConfig from './rollup.config'
import config from '../best-fe.config'

const asyncRead = promisify(fs.readFile);
const asyncWrite = promisify(fs.writeFile);

const fetchTemplate = async (): Promise<string> => {
    return asyncRead(path.resolve(__dirname, 'static-template.html'), 'utf8')
}

export const buildStaticFrontend = async (): Promise<boolean> => {
    const options = {
        projectIds: [1],
        timingOptions: ['all', '2-months', 'last-release'],
        branches: ['master'],
        config
    }

    try {
        const build = await rollup(rollupConfig.inputOptions(options));
        await build.generate(rollupConfig.outputOptions());
        await build.write(rollupConfig.outputOptions());

        const template = await fetchTemplate();
        const distDir = path.resolve(__dirname, '../../dist/static');

        const indexPath = path.resolve(distDir, 'index.html')
        await asyncWrite(indexPath, template);
    } catch (err) {
        return false;
    }

    return true;
}