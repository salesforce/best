/*
 * Copyright (c) 2019, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: MIT
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/MIT
 */

import AWS from 'aws-sdk';
import path from 'path';
import chalk from 'chalk';
import { lookup } from 'mime-types';

export const AWS_TEXT = chalk.reset.inverse.yellow.bold(' AWS-S3  ') + ' ';

const VERSION = 'v1.4';
const PREFIX = `public/${VERSION}`;
const BENCHMARKS = 'benchmarks';
const BRANCHES = 'branches';
const ONE_YEAR = 1000 * 60 * 60 * 24 * 365;

export class S3 {
    s3: AWS.S3;
    bucket: string;
    host: string;
    version: string;
    constructor({ bucket, version }: { bucket?: string; version?: string } = {}) {
        const bucketName = bucket || process.env.AWS_BUCKET_NAME;

        if (bucketName === undefined) {
            throw new Error('Bucket cannot be undefined');
        }

        this.s3 = new AWS.S3(...arguments);
        this.bucket = bucketName;
        this.host = `https://${this.bucket}.s3.amazonaws.com/`;
        this.version = version || VERSION;
    }

    async getBenchmarkUrlsForCommit(projectName: string, searchCommit: string) {
        console.log(AWS_TEXT, `Resolving objects for commit ${searchCommit}...`);
        const benchmarks = await this.getObjectsInFolder(projectName, BENCHMARKS, searchCommit);
        return benchmarks.map((bm) => this.getBenchmarkStatsUrl(projectName, searchCommit, bm));
    }

    getBenchmarkStatsUrl(projectName: string, searchCommit: string, benchmark: string) {
        return this.host + path.join(PREFIX, projectName, BENCHMARKS, searchCommit, benchmark);
    }

    getProjects() {
        return this.getObjectsInFolder('');
    }

    listBranches(projectName: string) {
        return this.getObjectsInFolder(projectName, BRANCHES);
    }

    getCommits(projectName: string, branchName: string) {
        return this.getObjectsInFolder(projectName, BRANCHES, branchName);
    }

    listBenchmarks(projectName: string, commit: string) {
        return this.getObjectsInFolder(projectName, BENCHMARKS, commit);
    }

    getObjectsInFolder(...args: string[]): Promise<string[]> {
        return new Promise((resolve, reject) => {
            const opts = {
                Bucket: this.bucket,
                Delimiter: '/',
                Prefix: path.join(PREFIX, args.join('/')) + '/',
            };

            this.s3.listObjectsV2(opts, (err, data) => {
                if (err) {
                    return reject(err);
                }

                const branches = data.CommonPrefixes!.map((p) => {
                    const parts = p.Prefix!.split('/');
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

    storeBranchCommitIndex(projectName: string, branch: string, commit: string) {
        const url = path.join(PREFIX, `${projectName}/${BRANCHES}/${branch}/${commit}`, 'index.json');
        const s3 = this.s3;
        const bucket = this.bucket;
        return new Promise((resolve, reject) => {
            s3.putObject(
                {
                    Bucket: bucket,
                    Key: url,
                    Body: `{ time: ${'' + new Date()} }`,
                    Expires: new Date(Date.now() + ONE_YEAR),
                    ContentType: lookup(url) || undefined,
                },
                (err, data) => {
                    if (err) {
                        return reject(err);
                    }
                    return resolve(data);
                },
            );
        });
    }

    storeBenchmarkFile(
        relativePath: string,
        body: string | Buffer,
        { projectName, commit, benchmarkName }: { projectName: string; commit: string; benchmarkName: string },
    ) {
        const url = path.join(PREFIX, projectName, BENCHMARKS, commit, benchmarkName, relativePath);
        const s3 = this.s3;
        const bucket = this.bucket;

        return new Promise((resolve, reject) => {
            s3.putObject(
                {
                    Bucket: bucket,
                    Key: url,
                    Body: body,
                    Expires: new Date(Date.now() + ONE_YEAR),
                    ContentType: lookup(url) || undefined,
                },
                (err, data) => {
                    if (err) {
                        return reject(err);
                    }
                    console.log(AWS_TEXT + url);
                    return resolve(data);
                },
            );
        });
    }
}
