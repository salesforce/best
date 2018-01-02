import mkdirp from "mkdirp";
import rimraf from "rimraf";
import path from "path";
import { ncp } from "ncp";
import { formatEnvironment } from "./md-formatter";
import { stringify } from "./pretty-json";
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

function formatJSON(json) {
    return stringify(json, {indent: 2, maxLength: 90 });
}

export function storeResults(benchmarkResults, globalConfig) {
    return Promise.all(benchmarkResults.map(async (benchmarkResult) => {
        const { benchmarkName, benchmarkSignature, projectConfig, environment, results, stats } = benchmarkResult;
        const { benchmarkOutput, cacheDirectory } = projectConfig;
        const outputFolder = path.resolve(benchmarkOutput, `${benchmarkName}_${benchmarkSignature.substr(0, 6)}`);
        const artifactsFolder = path.resolve(outputFolder, 'artifacts');
        const benchmarkFolder = path.resolve(cacheDirectory, benchmarkName);

        mkdirp.sync(outputFolder);
        rimraf.sync(artifactsFolder);
        await copyArtifacts(benchmarkFolder, artifactsFolder);

        // Environment
        fs.writeFileSync(path.resolve(outputFolder, 'environment.md'), formatEnvironment(environment), 'utf8');
        fs.writeFileSync(path.resolve(outputFolder, 'environment.json'), formatJSON(environment), 'utf8');

        // Results
        fs.writeFileSync(path.resolve(outputFolder, 'stats.json'), formatJSON(stats), 'utf8');
        fs.writeFileSync(path.resolve(outputFolder, 'raw_results.json'), formatJSON(results), 'utf8');

        benchmarkResult.benchmarkOutputResult = outputFolder;
        return true;
    }));
}
