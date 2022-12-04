/*
 * Copyright (c) 2019, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: MIT
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/MIT
 */

import path from 'path';
import { randomBytes } from 'crypto';

import { cacheDirectory } from '@best/utils';
import { x as extractTar } from 'tar';
import { Socket } from 'socket.io';
import SocketFile from './socket.io-file';
import type SocketIOFile from 'socket.io-file';

// This is all part of the initialization
const LOADER_CONFIG_DEFAULTS = {
    accepts: [],
    maxFileSize: 52428800, // 50 mb
    chunkSize: 10240, // 10kb
    transmissionDelay: 0,
    overwrite: true,
};

export function getUploaderInstance(socket: Socket): SocketIOFile {
    // In case multiple agents are connected to the same hub and multiple benchmarks are invoked concurrently,
    // if more than one benchmark has the exact same name, an error could occur because of a race condition.
    // This race condition is triggered when one client is uploading to the hub while the hub is uploading
    // same-named benchmark to the agent. When this happens, the agent may get a partial file or the hub may fail
    // because there is a lock on the same-named file.
    const config = Object.assign({}, LOADER_CONFIG_DEFAULTS, {
        uploadDir: path.join(cacheDirectory('best_agent'), 'uploads', randomBytes(16).toString('hex')),
    });

    const uploader: any = new (SocketFile as any)(socket, config);

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
    };

    return uploader;
}

export function extractBenchmarkTarFile(uploadDir: string) {
    const benchmarkDirname = path.dirname(uploadDir);
    return extractTar({ cwd: benchmarkDirname, file: uploadDir });
}
