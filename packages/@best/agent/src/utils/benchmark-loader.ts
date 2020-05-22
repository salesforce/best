/*
 * Copyright (c) 2019, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: MIT
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/MIT
*/

import path from "path";
import SocketIOFile from "socket.io-file";
import { cacheDirectory } from '@best/utils';
import { x as extractTar } from 'tar';
import { Socket } from "socket.io";

// This is all part of the initialization
const LOADER_CONFIG = {
    uploadDir: path.join(cacheDirectory('best_agent'), 'uploads'),
    accepts: [],
    maxFileSize: 52428800, // 50 mb
    chunkSize: 10240, // 10kb
    transmissionDelay: 0,
    overwrite: true,
};

// In order to make the uploader singleton, but yet allow multiple file downloads we need to do some manual cleanup
// The assumption is only one upload can occurr at the time, otherwise this code might not work as expected

export function getUploaderInstance(socket: Socket): SocketIOFile {
    const uploader: any = new SocketIOFile(socket, LOADER_CONFIG);
    uploader.load = function () {
        return new Promise((resolve, reject) => {
            uploader.on('complete', (info: any) => {
                uploader.removeAllListeners('complete');
                uploader.removeAllListeners('error');
                resolve(info.uploadDir);
            });

            uploader.on('error', (err: any) => {
                reject(err);
            });
        });
    }

    return uploader;
}

export function extractBenchmarkTarFile(uploadDir: string) {
    const benchmarkDirname = path.dirname(uploadDir);
    return extractTar({ cwd: benchmarkDirname, file: uploadDir });
}
