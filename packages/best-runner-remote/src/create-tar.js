import path from 'path';
import fs from 'fs';
import { c as createTar } from 'tar';

// Matches *.tgz files.
const tarballRegExp = /\.tgz$/;

export async function createTarBundle(artifactsFolder, benchmarkName) {
    return createTar(
        {
            gzip: true,
            cwd: artifactsFolder,
            noDirRecurse: true,
            filter: p => !tarballRegExp.test(p),
            file: path.resolve(artifactsFolder, `${benchmarkName}.tgz`),
        },
        fs.readdirSync(artifactsFolder),
    );
}
