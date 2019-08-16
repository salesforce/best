/*
 * Copyright (c) 2019, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: MIT
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/MIT
*/

import SocketIOFile from "socket.io-file";
import path from "path";
import { cacheDirectory } from '@best/utils';
import * as SocketIO from "socket.io";
import AgentLogger from "@best/agent-logger";

// This is all part of the initialization
const LOADER_CONFIG = {
    uploadDir: path.join(cacheDirectory('best_agent'), 'uploads'),
    accepts: [],
    maxFileSize: 52428800, // 50 mb
    chunkSize: 10240, // 10kb
    transmissionDelay: 0,
    overwrite: true,
};

const UPLOAD_START_TIMEOUT = 5000;

export async function loadBenchmarkJob(socketConnection: SocketIO.Socket, logger: AgentLogger): Promise<any> {
    return new Promise(async (resolve, reject) => {
        const socket = socketConnection;
        let uploaderTimeout: any = null;
        const uploader = new SocketIOFile(socket, LOADER_CONFIG);

        uploader.on('start', () => clearTimeout(uploaderTimeout));
        uploader.on('stream', ({ wrote, size }: any) => {
            logger.info(socketConnection.id, 'downloading', `${wrote} / ${size}`);
        });
        uploader.on('complete', (info: any) => resolve(info));
        uploader.on('error', (err: any) => reject(err));

        socket.emit('load_benchmark');
        uploaderTimeout = setTimeout(() => {
            uploader.destroy();

            reject(new Error(`Timed out waiting upload to start. Waited for ${UPLOAD_START_TIMEOUT}ms`));
        }, UPLOAD_START_TIMEOUT);
    });
}
