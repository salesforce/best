import AWS from "aws-sdk";
import path from "path";
import chalk from "chalk";
import { lookup } from "mime-types";

export const AWS_TEXT = chalk.reset.inverse.yellow.bold(' AWS-S3  ') + ' ';

const VERSION = 'v1';
const PREFIX = `public/${VERSION}`;
const BENCHMARKS = 'benchmarks';
export class S3 {
    constructor({ bucket, version } = {}) {
        this.s3 = new AWS.S3(...arguments);
        this.bucket = bucket || process.env.AWS_BUCKET_NAME;
        this.host = `https://${this.bucket}.s3.amazonaws.com/`;
        this.version = version || VERSION;
    }

    async getBenchmarkUrlsForCommit(projectName, searchCommit) {
        console.log(AWS_TEXT, `Resolving objects for commit ${searchCommit}...`);
        const branches = await this.getObjectsInFolder('commits', projectName, searchCommit);
        const branch = branches.pop();
        if (!branch) {
            throw new Error(`Commit ${searchCommit} could not be found in storage`);
        }
        const benchmarks = await this.getObjectsInFolder(BENCHMARKS, projectName, branch, searchCommit);
        return benchmarks.map(bm => this.host + path.join(PREFIX, BENCHMARKS, projectName, branch, searchCommit, bm));
    }

    listProjects() {
        return this.getObjectsInFolder(BENCHMARKS);
    }

    listBranches(projectName) {
        return this.getObjectsInFolder(BENCHMARKS, projectName);
    }

    listCommits(projectName, branchName) {
        return this.getObjectsInFolder(BENCHMARKS, projectName, branchName);
    }

    getObjectsInFolder(...args) {
        return new Promise((resolve, reject) => {
            const opts = {
                Bucket: this.bucket,
                Delimiter: '/',
                Prefix: path.join(PREFIX, args.join('/')) + '/'
            };

            this.s3.listObjectsV2(opts, (err, data) => {
                if (err) {
                    return reject(err);
                }

                const branches = data.CommonPrefixes.map((p) => {
                    p = p.Prefix.split('/');
                    return p[p.length - 2];
                });

                return resolve(branches);
            });
        });
    }
    _recursiveListBenchmarks(opts, callback, results) {
        this.s3.listObjectsV2(opts, (err, data) => {
            if (err) {
                callback(err);
            } else {
                if (data.Contents) {
                    results.push(...data.Contents);
                }

                if (data.NextContinuationToken) {
                    opts.ContinuationToken = data.NextContinuationToken;
                    this._recursiveListBenchmarks(opts, callback, results);
                } else {
                    callback(null, results);
                }
            }
        });
    }

    storeIndex(relativePath) {
        const url = path.join(PREFIX, relativePath, 'index.json');
        const s3 = this.s3;
        const bucket = this.bucket;
        return new Promise((resolve, reject) => {
            s3.putObject({
                Bucket: bucket,
                Key: url,
                Body: '{}',
                Expires: new Date(Date.now() + (1000 * 60 * 60 * 24 * 365) /* a year */),
                ContentType: lookup(url) || undefined
            }, (err, data) => {
                if (err) {
                    return reject(err);
                }
                return resolve(data);
            });
        });
    }

    storeBenchmarkFile(relativePath, body, { projectName, branch, commit, benchmarkName }) {
        const url = path.join(BENCHMARK_PREFIX, projectName, branch, commit, benchmarkName, relativePath);
        const s3 = this.s3;
        const bucket = this.bucket;

        return new Promise((resolve, reject) => {
            s3.putObject({
                Bucket: bucket,
                Key: url,
                Body: body,
                Expires: new Date(Date.now() + (1000 * 60 * 60 * 24 * 365) /* a year */),
                ContentType: lookup(url) || undefined
            }, (err, data) => {
                if (err) {
                    return reject(err);
                }
                console.log(AWS_TEXT + url);
                return resolve(data);
            });
        });
    }
}
