import path from 'path'
import fs from 'fs'
import { promisify } from 'util'
import { rollup } from 'rollup'
import { BenchmarkResultsSnapshot, FrozenGlobalConfig } from '@best/types';
import { OutputStream } from '@best/console-stream';

import rollupConfig from './rollup.config'

const asyncRead = promisify(fs.readFile);
const asyncWrite = promisify(fs.writeFile);

const fetchTemplate = async (): Promise<string> => {
    return asyncRead(path.resolve(__dirname, 'static-template.html'), 'utf8')
}

export const buildStaticFrontend = async (results: BenchmarkResultsSnapshot[], globalConfig: FrozenGlobalConfig, stream: NodeJS.WriteStream): Promise<boolean> => {
    if (! globalConfig.apiDatabase) { throw new Error('No database configured') }

    const outputStream = new OutputStream(stream, globalConfig.isInteractive);
    const { branch } = globalConfig.gitInfo;

    outputStream.writeln('Beginning to generate static HTML...');

    const projectNames = results.map((res): string => res.projectConfig.projectName);

    const options = {
        projectNames,
        timingOptions: ['all', '2-months', 'last-release'],
        branches: [branch],
        config: { apiDatabase: globalConfig.apiDatabase }
    }

    try {
        const build = await rollup(rollupConfig.inputOptions(options));
        await build.generate(rollupConfig.outputOptions());
        await build.write(rollupConfig.outputOptions());

        const template = await fetchTemplate();
        const distDir = path.resolve(__dirname, '../../dist/static');

        const indexPath = path.resolve(distDir, 'index.html');
        await asyncWrite(indexPath, template);

        outputStream.writeln(`Done generating static HTML. URL: ${indexPath}`);
    } catch (err) {
        outputStream.writeln('Error while trying to generate static HTML.');
        
        return false;
    }

    return true;
}