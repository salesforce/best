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

const UPLOAD_START_TIMEOUT = 5000;

export async function loadBenchmarkJob(job: BenchmarkJob): Promise<BenchmarkJob> {
    return new Promise(async (resolve, reject) => {
        const socket = job.socketConnection;
        let uploaderTimeout: any = null;
        const uploader = new SocketIOFile(socket, LOADER_CONFIG);

        const errorListener = (err: any) => {
            uploader.removeListener('complete', completeListener);
            uploader.removeListener('error', errorListener);

            reject(err);
        };

        const completeListener = (info: any) => {
            if (info.data['jobId'] === job.jobId) {
                uploader.removeListener('complete', completeListener);
                uploader.removeListener('error', errorListener);
                // set the job file, move from the incoming queue to the ready queue
                job.tarBundle = info.uploadDir;

                resolve(job);
            }
        };

        uploader.on('start', (info: any) => {
            console.log(info.data);
            if (info.data['jobId'] === job.jobId) {
                clearTimeout(uploaderTimeout)
            }
        });
        uploader.on('complete', completeListener);
        uploader.on('error', errorListener);

        socket.emit('load_benchmark', job.jobId);
        uploaderTimeout = setTimeout(() => {

            reject(new Error(`Timed out waiting upload to start. Waited for ${UPLOAD_START_TIMEOUT}ms`));
        }, UPLOAD_START_TIMEOUT);
    });
}
