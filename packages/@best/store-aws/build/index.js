"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const aws_wrapper_1 = require("./aws-wrapper");
const fs_1 = __importDefault(require("fs"));
const chalk_1 = __importDefault(require("chalk"));
const node_fetch_1 = __importDefault(require("node-fetch"));
const INIT_RUNNING_TEXT = chalk_1.default.bold.dim('\nPushing to AWS(S3)...');
let S3_INSTANCE;
function getS3Instance() {
    if (!S3_INSTANCE) {
        S3_INSTANCE = new aws_wrapper_1.S3();
    }
    return S3_INSTANCE;
}
function initialize( /* config */) {
    getS3Instance();
}
exports.initialize = initialize;
async function storeBenchmarkResults(fileMap, { benchmarkName, benchmarkSignature, projectConfig }, globalConfig) {
    const { gitCommit, gitBranch, gitLocalChanges } = globalConfig;
    const { projectName } = projectConfig;
    // Replace slashes with underscores so we prevent ambiguous URLs
    const branch = (gitLocalChanges ? `local/${gitBranch}` : gitBranch).replace(/\//g, '_');
    const commit = gitLocalChanges ? `${gitCommit}_${benchmarkSignature.slice(0, 7)}` : gitCommit.slice(0, 7);
    console.log(INIT_RUNNING_TEXT);
    const s3 = getS3Instance();
    console.log('Bucket:', `https://${s3.bucket}.s3.amazonaws.com/`, '\n');
    await Promise.all(Object.keys(fileMap).map(file => {
        const buffer = fs_1.default.readFileSync(fileMap[file]);
        return s3.storeBenchmarkFile(file, buffer, {
            projectName,
            commit,
            benchmarkName,
        });
    }));
    // This will allow us to search in the bucket by brach/commit
    await s3.storeBranchCommitIndex(projectName, branch, commit);
}
exports.storeBenchmarkResults = storeBenchmarkResults;
async function getAllBenchmarkStatsPerCommit(projectName, commit) {
    const s3 = getS3Instance();
    const benchmarks = await s3.getBenchmarkUrlsForCommit(projectName, commit);
    if (benchmarks && benchmarks.length) {
        console.log(aws_wrapper_1.AWS_TEXT + ` Fetching benchmarks for commit ${commit}...`);
        return Promise.all(benchmarks.map(async (url) => {
            const fullUrl = url + '/stats.json';
            console.log(aws_wrapper_1.AWS_TEXT + ` Fetching benchmark ${fullUrl}`);
            const response = await node_fetch_1.default(fullUrl);
            const json = await response.json();
            return Object.assign(json, { projectName });
        }));
    }
    return benchmarks;
}
exports.getAllBenchmarkStatsPerCommit = getAllBenchmarkStatsPerCommit;
function getProjects() {
    const s3 = getS3Instance();
    return s3.getProjects();
}
exports.getProjects = getProjects;
function getCommits(projectName, branch) {
    const s3 = getS3Instance();
    return s3.getCommits(projectName, branch);
}
exports.getCommits = getCommits;
//# sourceMappingURL=index.js.map