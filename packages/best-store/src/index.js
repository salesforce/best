import mkdirp from 'mkdirp';
import rimraf from 'rimraf';
import path from 'path';
import { ncp } from 'ncp';
import { formatEnvironment } from './md-formatter';
import { stringify } from './pretty-json';
import fs from 'fs';
import chalk from 'chalk';

function copyArtifacts(benchmarkFolder, outputFolder) {
    return new Promise((resolve, reject) => {
        ncp(benchmarkFolder, outputFolder, err => {
            if (err) {
                reject(err);
            } else {
                resolve();
            }
        });
    });
}

function formatJSON(json) {
    return stringify(json, { indent: 2, maxLength: 90 });
}

function getStoredFileMapping(benchmarkFolder, artifactsFolder) {
    const WHITELIST = ['.js', '.html', '.css', '.json'];

    const currentFiles = fs.readdirSync(benchmarkFolder);
    const artifactFiles = fs.readdirSync(artifactsFolder).map(p => path.join('artifacts', p));
    const files = [...currentFiles, ...artifactFiles].filter(p => WHITELIST.includes(path.extname(p)));

    return files.reduce((map, file) => {
        map[file] = path.join(benchmarkFolder, file);
        return map;
    }, {});
}

export function storeBenchmarkResults(benchmarkResults, globalConfig) {
    return Promise.all(
        benchmarkResults.map(async benchmarkResult => {
            const { benchmarkName, benchmarkSignature, projectConfig, environment, results, stats } = benchmarkResult;
            const { benchmarkOutput, cacheDirectory, projectName } = projectConfig;
            const { externalStorage } = globalConfig;
            const outputFolder = path.join(benchmarkOutput, projectName, `${benchmarkName}_${benchmarkSignature.substr(0, 6)}`);
            const artifactsFolder = path.join(outputFolder, 'artifacts');
            const benchmarkFolder = path.join(cacheDirectory, benchmarkName);

            mkdirp.sync(outputFolder);
            rimraf.sync(artifactsFolder);
            await copyArtifacts(benchmarkFolder, artifactsFolder);

            // Environment
            fs.writeFileSync(path.join(outputFolder, 'environment.md'), formatEnvironment(environment), 'utf8');

            // Results
            fs.writeFileSync(path.join(outputFolder, 'stats.json'), formatJSON(stats), 'utf8');
            fs.writeFileSync(path.join(outputFolder, 'raw_results.json'), formatJSON(results), 'utf8');
            benchmarkResult.benchmarkOutputResult = outputFolder;

            if (externalStorage) {
                try {
                    const storageModule = require(externalStorage);
                    const fileMap = getStoredFileMapping(outputFolder, artifactsFolder);
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
