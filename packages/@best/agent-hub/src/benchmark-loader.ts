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


export async function loadBenchmarkJob(job: BenchmarkJob): Promise<BenchmarkJob> {
    return new Promise(async (resolve, reject) => {
        const socket = job.socketConnection;

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

        uploader.on('complete', completeListener);
        uploader.once('error', errorListener);

        socket.emit('load_benchmark', job.jobId);
    });
}
