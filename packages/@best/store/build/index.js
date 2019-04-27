"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mkdirp_1 = __importDefault(require("mkdirp"));
const rimraf_1 = __importDefault(require("rimraf"));
const path_1 = __importDefault(require("path"));
const ncp_1 = require("ncp");
const md_formatter_1 = require("./md-formatter");
const pretty_json_1 = require("./pretty-json");
const fs_1 = __importDefault(require("fs"));
const chalk_1 = __importDefault(require("chalk"));
function copyArtifacts(benchmarkFolder, outputFolder) {
    return new Promise((resolve, reject) => {
        ncp_1.ncp(benchmarkFolder, outputFolder, err => {
            if (err) {
                reject(err);
            }
            else {
                resolve();
            }
        });
    });
}
function formatJSON(json) {
    return pretty_json_1.stringify(json, { indent: "2", maxLength: 90 });
}
function getStoredFileMapping(benchmarkFolder, artifactsFolder) {
    const WHITELIST = ['.js', '.html', '.css', '.json'];
    const currentFiles = fs_1.default.readdirSync(benchmarkFolder);
    const artifactFiles = fs_1.default.readdirSync(artifactsFolder).map(p => path_1.default.join('artifacts', p));
    const files = [...currentFiles, ...artifactFiles].filter(p => WHITELIST.includes(path_1.default.extname(p)));
    return files.reduce((map, file) => {
        map[file] = path_1.default.join(benchmarkFolder, file);
        return map;
    }, {});
}
function storeBenchmarkResults(benchmarkResults, globalConfig) {
    return Promise.all(benchmarkResults.map(async (benchmarkResult) => {
        const { benchmarkName, benchmarkSignature, projectConfig, environment, results, stats } = benchmarkResult;
        const { benchmarkOutput, cacheDirectory, projectName } = projectConfig;
        const { externalStorage, gitCommit, gitLocalChanges } = globalConfig;
        const hash = gitLocalChanges ? 'local_' + benchmarkSignature.substr(0, 6) : gitCommit;
        const outputFolder = path_1.default.join(benchmarkOutput, projectName, `${benchmarkName}_${hash}`);
        const artifactsFolder = path_1.default.join(outputFolder, 'artifacts');
        const benchmarkFolder = path_1.default.join(cacheDirectory, projectName, benchmarkName);
        mkdirp_1.default.sync(outputFolder);
        rimraf_1.default.sync(artifactsFolder);
        await copyArtifacts(benchmarkFolder, artifactsFolder);
        // Environment
        fs_1.default.writeFileSync(path_1.default.join(outputFolder, 'environment.md'), md_formatter_1.formatEnvironment(environment), 'utf8');
        // Results
        fs_1.default.writeFileSync(path_1.default.join(outputFolder, 'stats.json'), formatJSON(stats), 'utf8');
        fs_1.default.writeFileSync(path_1.default.join(outputFolder, 'raw_results.json'), formatJSON(results), 'utf8');
        benchmarkResult.benchmarkOutputResult = outputFolder;
        if (externalStorage) {
            try {
                const storageModule = require(externalStorage);
                const fileMap = getStoredFileMapping(outputFolder, artifactsFolder);
                await storageModule.storeBenchmarkResults(fileMap, benchmarkResult, globalConfig);
            }
            catch (err) {
                const ERR_TEXT = chalk_1.default.reset.inverse.red.bold('  ERROR   ') + ' ';
                console.log(ERR_TEXT + `Unable to push to external storage ${chalk_1.default.bold(externalStorage)}: `, err.message || err, '\n');
                throw new Error('[best-store] Error executing externalStorage: ' + externalStorage);
            }
        }
        return true;
    }));
}
exports.storeBenchmarkResults = storeBenchmarkResults;
//# sourceMappingURL=index.js.map