/// <reference types="node" />
import EventEmitter from 'events';
export default class SocketIOFileClient extends EventEmitter {
    instanceId: number | undefined;
    uploadId: number;
    accepts: never[] | undefined;
    maxFileSize: undefined;
    socket: any;
    uploadingFiles: any;
    isDestroyed: boolean | undefined;
    chunkSize: any;
    ev: null;
    constructor(socket: any);
    getUploadId(): string;
    _upload(file: any, { uploadTo, data }?: any): void;
    upload(filePath: string, options?: any): {
        name: string;
        type: string;
        uploadId: string;
        buffer: Buffer;
        size: number;
    };
    abort(id: string): void;
    destroy(): void;
    getUploadInfo(): any;
}
