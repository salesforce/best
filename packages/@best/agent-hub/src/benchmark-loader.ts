import crypto from "crypto";
import SocketIOFile from "socket.io-file";
import path from "path";
import { cacheDirectory } from '@best/utils';
import BenchmarkJob from "./BenchmarkJob";

// This is all part of the initialization
const LOADER_CONFIG = {
    uploadDir: path.join(cacheDirectory('best_agent'), 'uploads'),
    accepts: [],
    maxFileSize: 52428800, // 50 mb
    chunkSize: 10240, // 10kb
    transmissionDelay: 0,
    overwrite: true,
};

function generateUUID() : string {
    return crypto.randomBytes(8).toString("hex");
}

const UPLOAD_START_TIMEOUT = 5000;

export async function loadBenchmarkJob(job: BenchmarkJob): Promise<BenchmarkJob> {
    return new Promise(async (resolve, reject) => {
        const socket = job.socketConnection;
        let uploaderTimeout: any = null;
        const loaderOverriddenConfig = Object.assign(
            {},
            LOADER_CONFIG,
            {
                uploadDir: path.join(LOADER_CONFIG.uploadDir, generateUUID())
            }
        );
        const uploader = new SocketIOFile(socket, loaderOverriddenConfig);

        uploader.on('start', (info: any) => {
            if (info.data['jobId'] === job.jobId) {
                clearTimeout(uploaderTimeout)
            }
        });
        uploader.on('complete', (info: any) => {
            if (info.data['jobId'] === job.jobId) {
                job.tarBundle = info.uploadDir;

                resolve(job);
            }
        });
        uploader.on('error', (err: any) => reject(err));

        socket.emit('load_benchmark', job.jobId);
        uploaderTimeout = setTimeout(() => {

            reject(new Error(`Timed out waiting upload to start. Waited for ${UPLOAD_START_TIMEOUT}ms`));
        }, UPLOAD_START_TIMEOUT);
    });
}
