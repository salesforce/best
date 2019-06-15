import SocketIOFile from "socket.io-file";
import path from "path";
import { cacheDirectory } from '@best/utils';
import * as SocketIO from "socket.io";

// This is all part of the initialization
const LOADER_CONFIG = {
    uploadDir: path.join(cacheDirectory('best_agent'), 'uploads'),
    accepts: [],
    maxFileSize: 52428800, // 50 mb
    chunkSize: 10240, // 10kb
    transmissionDelay: 0,
    overwrite: true,
};


export async function loadBenchmarkJob(socketConnection: SocketIO.Socket): Promise<any> {
    return new Promise(async (resolve, reject) => {
        const socket = socketConnection;

        const uploader = new SocketIOFile(socket, LOADER_CONFIG);

        const errorListener = (err: any) => {
            uploader.removeListener('complete', completeListener);
            uploader.removeListener('error', errorListener);

            reject(err);
        };

        const completeListener = (info: any) => {
            uploader.removeListener('complete', completeListener);
            uploader.removeListener('error', errorListener);

            resolve(info);
        };

        uploader.on('complete', completeListener);
        uploader.on('error', errorListener);

        socket.emit('load_benchmark');
    });
}
