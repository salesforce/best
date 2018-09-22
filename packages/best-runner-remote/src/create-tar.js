import path from 'path';
import fs from 'fs';
import { c as createTar } from 'tar';

export async function createTarBundle(artifactsFolder, benchmarkName) {
    return createTar(
        {
            gzip: true,
            cwd: artifactsFolder,
            noDirRecurse: true,
            filter: p => !/\.tgz$/.test(p),
            file: path.resolve(artifactsFolder, `${benchmarkName}.tgz`),
        },
        fs.readdirSync(artifactsFolder),
    );
}
