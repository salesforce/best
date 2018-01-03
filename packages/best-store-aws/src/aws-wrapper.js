import AWS from "aws-sdk";
import path from "path";
import chalk from "chalk";
import { lookup } from "mime-types";

const AWS_TEXT = chalk.reset.inverse.yellow.bold(' S3-PUSH  ') + ' ';

export class S3 {
    constructor({ bucket } = {}) {
        this.s3 = new AWS.S3(...arguments);
        this.bucket = bucket || process.env.AWS_BUCKET_NAME;
    }

    listProjects(project) {
        return new Promise((resolve, reject) => {
            const opts = { Bucket: this.bucket, Delimiter: '/', Prefix: `public/${project}/` };
            this.s3.listObjectsV2(opts, (err, data) => {
                if (err) { return reject(err); }

                const projects = data.CommonPrefixes.map((p) => {
                    p = p.Prefix.split('/');
                    return p[p.length - 2];
                });

                return resolve(projects);
            });
        });
    }
    storeFile(relativePath, body, { projectName, branch, commit, benchmarkName }) {
        const url = path.join('public', projectName, branch, commit, benchmarkName, relativePath);
        const s3 = this.s3;
        const bucket = this.bucket;

        return new Promise((resolve, reject) => {
            s3.putObject({
                Bucket: bucket,
                Key: url,
                Body: body,
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
