import path from 'path';
import { formatEnvironment } from './md-formatter';
import { stringify } from './pretty-json';
import fs from 'fs';
import chalk from 'chalk';
import { BenchmarkResultsSnapshot, FrozenGlobalConfig } from "@best/types";

function formatJSON(json: any) {
    return stringify(json, { indent: 2, maxLength: 90 });
}

function getStoredFileMapping(benchmarkFolder: string, artifactsFolder: string): { [key: string]: string } {
    const WHITELIST = ['.js', '.html', '.css', '.json'];

    const currentFiles = fs.readdirSync(benchmarkFolder);
    const artifactFiles = fs.readdirSync(artifactsFolder).map(p => path.join('artifacts', p));
    const files = [...currentFiles, ...artifactFiles].filter(p => WHITELIST.includes(path.extname(p)));

    return files.reduce((map: { [key: string]: string }, file: string) => {
        map[file] = path.join(benchmarkFolder, file);
        return map;
    }, {});
}

export function storeBenchmarkResults(benchmarkResults: BenchmarkResultsSnapshot[], globalConfig: FrozenGlobalConfig) {
    return Promise.all(
        benchmarkResults.map(async (benchmarkResult: BenchmarkResultsSnapshot) => {
            const { environment, results, stats, projectConfig } = benchmarkResult;
            const { externalStorage } =  globalConfig;
            const { benchmarkOutput: benchmarkFolder } = projectConfig;

            const artifactsFolder = path.join(benchmarkFolder, 'artifacts');

            // Environment
            fs.writeFileSync(path.join(benchmarkFolder, 'environment.md'), formatEnvironment(environment), 'utf8');

            // Results
            fs.writeFileSync(path.join(benchmarkFolder, 'stats.json'), formatJSON(stats), 'utf8');
            fs.writeFileSync(path.join(benchmarkFolder, 'raw_results.json'), formatJSON(results), 'utf8');

            if (externalStorage) {
                try {
                    const storageModule = require(externalStorage);
                    const fileMap = getStoredFileMapping(benchmarkFolder, artifactsFolder);
                    await storageModule.storeBenchmarkResults(fileMap, benchmarkResult, globalConfig);
                } catch (err) {
                    const ERR_TEXT = chalk.reset.inverse.red.bold('  ERROR   ') + ' ';
                    console.log(
                        ERR_TEXT + `Unable to push to external storage ${chalk.bold(externalStorage)}: `,
                        err.message || err,
                        '\n',
                    );
                    throw new Error('[best-store] Error executing externalStorage: ' + externalStorage);
                }
            }
            return true;
        }),
    );
}
