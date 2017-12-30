import mkdirp from "mkdirp";
import rimraf from "rimraf";
import path from "path";
import { ncp } from "ncp";
import { formatEnvironment } from "./md-formatter";
import fs from "fs";

function copyArtifacts(benchmarkFolder, outputFolder) {
    return new Promise((resolve, reject) => {
        ncp(benchmarkFolder, outputFolder, (err) => {
            if (err) {
                reject(err);
            } else {
                resolve();
            }
        });
    });
}

function pretty(json) {
    return JSON.stringify(json, null, '  ');
}

export async function storeResults(benchmarkResults, globalConfig) {
    return Promise.all(benchmarkResults.map(async (benchmarkResult) => {
        const { benchmarkName, benchmarkSignature, proyectConfig, environment, results } = benchmarkResult;
        const { benchmarkOutput, cacheDirectory } = proyectConfig;
        const outputFolder = path.resolve(benchmarkOutput, `${benchmarkName}_${benchmarkSignature.substr(0, 6)}`);
        const artifactsFolder = path.resolve(outputFolder, 'artifacts');
        const benchmarkFolder = path.resolve(cacheDirectory, benchmarkName);

        mkdirp.sync(outputFolder);
        rimraf.sync(artifactsFolder);
        await copyArtifacts(benchmarkFolder, artifactsFolder);

        // Environment
        fs.writeFileSync(path.resolve(outputFolder, 'environment.md'), formatEnvironment(environment), 'utf8');
        fs.writeFileSync(path.resolve(outputFolder, 'environment.json'), pretty(environment), 'utf8');

        // Results
        fs.writeFileSync(path.resolve(outputFolder, 'raw_results.json'), pretty(results), 'utf8');

        return true;
    }));
}
