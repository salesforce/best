import path from 'path';
import fs from 'fs';
import { c as createTar } from 'tar';

export async function createTarBundle(artifactsFolder, benchmarkName) {
    return createTar(
        {
            gzip: true,
            cwd: artifactsFolder,
            noDirRecurse: true,
            filter: p => {
                const ext = path.extname(p);
                return ext === '.js' || ext === '.html' || ext === '.css';
            },
            file: path.resolve(artifactsFolder, `${benchmarkName}.tgz`),
        },
        fs.readdirSync(artifactsFolder),
    );
}
