// This is a rewrite to support NodeJS
// The browser version is in:
// https://github.com/rico345100/socket.io-file-client

import fs from 'fs';
import path from 'path';
import EventEmitter from 'events';

let instanceId = 0;
const getInstanceId = () => instanceId++;

export default class SocketIOFileClient extends EventEmitter {
    constructor(socket) {
        super();

        if (!socket) {
            return this.emit(
                'error',
                new Error('SocketIOFile requires Socket.'),
            );
        }

        this.instanceId = getInstanceId(); // using for identifying multiple file upload from SocketIOFileClient objects
        this.uploadId = 0; // using for identifying each uploading
        this.accepts = [];
        this.maxFileSize = undefined;
        this.socket = socket;
        this.uploadingFiles = {};
        this.isDestroyed = false;

        socket.on(
            'socket.io-file::recvSync',
            ({ maxFileSize, accepts, chunkSize }) => {
                this.maxFileSize = maxFileSize || undefined;
                this.accepts = accepts || [];
                this.chunkSize = chunkSize || 10240;
                this.emit('ready');
            },
        );

        socket.emit('socket.io-file::reqSync');
        socket.on('socket.io-file::disconnectByServer', () => {
            this.emit('disconnected');
            this.destroy();
        });
    }
    getUploadId() {
        return 'u_' + this.uploadId++;
    }

    _upload(file, { uploadTo, data = {} } = {}) {
        const { uploadingFiles, socket, chunkSize } = this;
        const { buffer, name, size, uploadId } = file;
        const fileState = {
            id: uploadId,
            name,
            size,
            chunkSize,
            sent: 0,
            data,
        };

        // put into uploadingFiles list
        uploadingFiles[uploadId] = uploadId;

        // request the server to make a file
        this.emit('start', { uploadId, name, size, uploadTo, data });
        socket.emit('socket.io-file::createFile', fileState);

        const sendChunk = () => {
            if (fileState.aborted) {
                return;
            }

            if (fileState.sent >= buffer.byteLength) {
                socket.emit('socket.io-file::done::' + uploadId);
                return;
            }

            const chunk = buffer.slice(
                fileState.sent,
                fileState.sent + chunkSize,
            );

            this.emit('stream', {
                uploadId,
                name,
                size,
                sent: fileState.sent,
                uploadTo,
                data,
            });
            socket.once('socket.io-file::request::' + uploadId, sendChunk);
            socket.emit('socket.io-file::stream::' + uploadId, chunk);

            fileState.sent += chunk.byteLength;
            this.uploadingFiles[uploadId] = fileState;
        };

        socket.once('socket.io-file::request::' + uploadId, sendChunk);
        socket.on('socket.io-file::complete::' + uploadId, info => {
            info.uploadId = fileState.id;
            info.data = fileState.data;

            socket.removeAllListeners('socket.io-file::abort::' + uploadId);
            socket.removeAllListeners('socket.io-file::error::' + uploadId);
            socket.removeAllListeners('socket.io-file::complete::' + uploadId);

            this.uploadingFiles[uploadId] = null;
            this.emit('complete', info);
        });
        socket.on('socket.io-file::abort::' + uploadId, info => {
            fileState.aborted = true;
            this.emit('abort', {
                uploadId: fileState.id,
                name: fileState.name,
                size: fileState.size,
                sent: fileState.sent,
                wrote: info.wrote,
                uploadTo,
                data,
            });
        });
        socket.on('socket.io-file::error::' + uploadId, err => {
            this.emit('error', new Error(err.message), {
                uploadId: fileState.id,
                name: fileState.name,
                size: fileState.size,
                uploadTo,
                data,
            });
        });
    }

    upload(filePath, options) {
        if (this.isDestroyed) {
            throw new Error('SocketIOFileClient is closed.');
        }

        const { size } = fs.statSync(filePath);
        const buffer = fs.readFileSync(filePath);
        const file = {
            name: path.basename(filePath),
            type: path.extname(filePath),
            uploadId: this.getUploadId(),
            buffer,
            size,
        };

        this._upload(file, options);
        return file;
    }

    abort(id) {
        if (this.isDestroyed) {
            throw new Error('SocketIOFileClient is closed.');
        }
        this.socket.emit('socket.io-file::abort::' + id);
    }

    destroy() {
        if (this.isDestroyed) {
            throw new Error('SocketIOFileClient is closed.');
        }

        Object.keys(this.uploadingFiles).forEach(k => this.abort(k));
        this.socket = null;
        this.uploadingFiles = null;
        this.ev = null;
        this.isDestroyed = true;
    }

    getUploadInfo() {
        return JSON.parse(JSON.stringify(this.uploadingFiles));
    }
}
