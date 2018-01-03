import AWS from "aws-sdk";
import path from "path";
import chalk from "chalk";
import { lookup } from "mime-types";

const AWS_TEXT = chalk.reset.inverse.yellow.bold(' S3-PUSH  ') + ' ';
const PREFIX = 'public/benchmarks';
export class S3 {
    constructor({
        bucket
    } = {}) {
        this.s3 = new AWS.S3(...arguments);
        this.bucket = bucket || process.env.AWS_BUCKET_NAME;
    }

    listProjects() {
        return new Promise((resolve, reject) => {
            const opts = {
                Bucket: this.bucket,
                Delimiter: '/',
                Prefix: `${PREFIX}/`
            };

            this.s3.listObjectsV2(opts, (err, data) => {
                if (err) {
                    return reject(err);
                }

                const projects = data.CommonPrefixes.map((p) => {
                    p = p.Prefix.split('/');
                    return p[p.length - 2];
                });

                return resolve(projects);
            });
        });
    }

    listBranches(projectName) {
        return new Promise((resolve, reject) => {
            const opts = {
                Bucket: this.bucket,
                Delimiter: '/',
                Prefix: `${PREFIX}/${projectName}/`
            };

            this.s3.listObjectsV2(opts, (err, data) => {
                if (err) {
                    return reject(err);
                }
                const projects = data.CommonPrefixes.map((p) => {
                    p = p.Prefix.split('/');
                    return p[p.length - 2];
                });

                return resolve(projects);
            });
        });
    }

    listCommits(projectName, branchName) {
        return new Promise((resolve, reject) => {
            const opts = {
                Bucket: this.bucket,
                Delimiter: '/',
                Prefix: `${PREFIX}/${projectName}/${branchName}/`
            };

            this.s3.listObjectsV2(opts, (err, data) => {
                if (err) {
                    return reject(err);
                }
                const projects = data.CommonPrefixes.map((p) => {
                    p = p.Prefix.split('/');
                    return p[p.length - 2];
                });

                return resolve(projects);
            });
        });
    }

    listBenchmarks(benchmarkProjectName, gitBranch) {
        return new Promise((resolve, reject) => {
            gitBranch = (gitBranch && gitBranch.replace(/\//g, '_'));
            const opts = {
                Bucket: this.bucket,
                Delimiter: '/artifacts/',
                Prefix: [`${PREFIX}/`, benchmarkProjectName, gitBranch ? `${gitBranch}/` : '/'].join('')
            };

            this._recursiveListBenchmarks(opts, (err, results) => {
                if (err) {
                    return reject(err);
                }

                results = results
                    .filter((r) => r.Key.endsWith('/stats.json'))
                    .sort((a, b) => Date.parse(a.LastModified) - Date.parse(b.LastModified))
                    .map(({ Key }) => {
                        const parts = Key.replace(PREFIX + '/', '').split('/');
                        const [projectName, branch, commit, benchmarkName] = parts;
                        return {
                            projectName,
                            branch: branch.replace(/_/g, '/'),
                            commit,
                            benchmarkName,
                            stats: Key
                        };
                    });

                resolve(results);
            }, []);
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

    storeFile(relativePath, body, {
        projectName,
        branch,
        commit,
        benchmarkName
    }) {
        const url = path.join(PREFIX, projectName, branch, commit, benchmarkName, relativePath);
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
