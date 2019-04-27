"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const aws_sdk_1 = __importDefault(require("aws-sdk"));
const path_1 = __importDefault(require("path"));
const chalk_1 = __importDefault(require("chalk"));
const mime_types_1 = require("mime-types");
exports.AWS_TEXT = chalk_1.default.reset.inverse.yellow.bold(' AWS-S3  ') + ' ';
const VERSION = 'v1.4';
const PREFIX = `public/${VERSION}`;
const BENCHMARKS = 'benchmarks';
const BRANCHES = 'branches';
const ONE_YEAR = 1000 * 60 * 60 * 24 * 365;
class S3 {
    constructor({ bucket, version } = {}) {
        const bucketName = bucket || process.env.AWS_BUCKET_NAME;
        if (bucketName === undefined) {
            throw new Error('Bucket cannot be undefined');
        }
        this.s3 = new aws_sdk_1.default.S3(...arguments);
        this.bucket = bucketName;
        this.host = `https://${this.bucket}.s3.amazonaws.com/`;
        this.version = version || VERSION;
    }
    async getBenchmarkUrlsForCommit(projectName, searchCommit) {
        console.log(exports.AWS_TEXT, `Resolving objects for commit ${searchCommit}...`);
        const benchmarks = await this.getObjectsInFolder(projectName, BENCHMARKS, searchCommit);
        return benchmarks.map(bm => this.getBenchmarkStatsUrl(projectName, searchCommit, bm));
    }
    getBenchmarkStatsUrl(projectName, searchCommit, benchmark) {
        return this.host + path_1.default.join(PREFIX, projectName, BENCHMARKS, searchCommit, benchmark);
    }
    getProjects() {
        return this.getObjectsInFolder('');
    }
    listBranches(projectName) {
        return this.getObjectsInFolder(projectName, BRANCHES);
    }
    getCommits(projectName, branchName) {
        return this.getObjectsInFolder(projectName, BRANCHES, branchName);
    }
    listBenchmarks(projectName, commit) {
        return this.getObjectsInFolder(projectName, BENCHMARKS, commit);
    }
    getObjectsInFolder(...args) {
        return new Promise((resolve, reject) => {
            const opts = {
                Bucket: this.bucket,
                Delimiter: '/',
                Prefix: path_1.default.join(PREFIX, args.join('/')) + '/',
            };
            this.s3.listObjectsV2(opts, (err, data) => {
                if (err) {
                    return reject(err);
                }
                const branches = data.CommonPrefixes.map(p => {
                    const parts = p.Prefix.split('/');
                    return parts[parts.length - 2];
                });
                return resolve(branches);
            });
        });
    }
    // _recursiveListBenchmarks(opts, callback, results) {
    //     this.s3.listObjectsV2(opts, (err, data) => {
    //         if (err) {
    //             callback(err);
    //         } else {
    //             if (data.Contents) {
    //                 results.push(...data.Contents);
    //             }
    //             if (data.NextContinuationToken) {
    //                 opts.ContinuationToken = data.NextContinuationToken;
    //                 this._recursiveListBenchmarks(opts, callback, results);
    //             } else {
    //                 callback(null, results);
    //             }
    //         }
    //     });
    // }
    storeBranchCommitIndex(projectName, branch, commit) {
        const url = path_1.default.join(PREFIX, `${projectName}/${BRANCHES}/${branch}/${commit}`, 'index.json');
        const s3 = this.s3;
        const bucket = this.bucket;
        return new Promise((resolve, reject) => {
            s3.putObject({
                Bucket: bucket,
                Key: url,
                Body: `{ time: ${'' + new Date()} }`,
                Expires: new Date(Date.now() + ONE_YEAR),
                ContentType: mime_types_1.lookup(url) || undefined,
            }, (err, data) => {
                if (err) {
                    return reject(err);
                }
                return resolve(data);
            });
        });
    }
    storeBenchmarkFile(relativePath, body, { projectName, commit, benchmarkName }) {
        const url = path_1.default.join(PREFIX, projectName, BENCHMARKS, commit, benchmarkName, relativePath);
        const s3 = this.s3;
        const bucket = this.bucket;
        return new Promise((resolve, reject) => {
            s3.putObject({
                Bucket: bucket,
                Key: url,
                Body: body,
                Expires: new Date(Date.now() + ONE_YEAR),
                ContentType: mime_types_1.lookup(url) || undefined,
            }, (err, data) => {
                if (err) {
                    return reject(err);
                }
                console.log(exports.AWS_TEXT + url);
                return resolve(data);
            });
        });
    }
}
exports.S3 = S3;
//# sourceMappingURL=aws-wrapper.js.map