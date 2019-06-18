import path from 'path'
import fs from 'fs'
import { promisify } from 'util'
import { rollup } from 'rollup'

import rollupConfig from './rollup.config'

const asyncRead = promisify(fs.readFile);
const asyncWrite = promisify(fs.writeFile);

const buildTemplate = async (data: any) => {
    const HTML_TEMPLATE = await asyncRead(path.resolve(__dirname, '../server', 'static-template.html'), 'utf8')

    const jsBody = `window.BEST_DATA = ${JSON.stringify(data)}`

    return HTML_TEMPLATE.replace('{JS_BODY}', jsBody);
}

export const buildStaticFrontend = async () => {
    console.log('building static frontend...')

    const template = await buildTemplate({ hello: 'World', date: (new Date).toISOString() });
    const distDir = path.resolve(__dirname, '../dist');

    await asyncWrite(path.resolve(distDir, 'index.html'), template);
    await rollup(rollupConfig);
    console.log('done!')
}