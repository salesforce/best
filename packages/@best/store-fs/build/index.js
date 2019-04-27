"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = __importDefault(require("fs"));
const globby_1 = __importDefault(require("globby"));
let ROOT_DIR = process.cwd();
const IGNORE_PATHS = [
    '**/node_modules/**',
    '**/__tests__/**'
];
function initialize({ rootDir }) {
    ROOT_DIR = rootDir || ROOT_DIR;
}
exports.initialize = initialize;
async function storeBenchmarkResults(
// fileMap,
// { benchmarkName, benchmarkSignature, projectConfig },
// globalConfig,
) {
    throw new Error('Method not implemented yet...');
}
exports.storeBenchmarkResults = storeBenchmarkResults;
async function getAllBenchmarkStatsPerCommit(projectName, commit) {
    const pattern = `**/${projectName}/*.benchmark_${commit}/stats.json`;
    const results = await globby_1.default([pattern], { cwd: ROOT_DIR, ignore: IGNORE_PATHS });
    const statsResults = results.map(statsPath => {
        const stats = JSON.parse(fs_1.default.readFileSync(statsPath, 'utf8'));
        return { ...stats, projectName };
    });
    return statsResults;
}
exports.getAllBenchmarkStatsPerCommit = getAllBenchmarkStatsPerCommit;
function getProjects() {
    throw new Error('Method not implemented yet...');
}
exports.getProjects = getProjects;
function getCommits( /* projectName, branch */) {
    throw new Error('Method not implemented yet...');
}
exports.getCommits = getCommits;
//# sourceMappingURL=index.js.map