import SocketIO from "socket.io-client";
import SocketIOFile from "./file-uploader";
import fs from "fs";
import path from "path";

const SOCKET_IO_OPTS = { path: '/best' };
const socket = SocketIO('http://localhost:5000', SOCKET_IO_OPTS);

socket.on('connect', () => {
    console.log('>> Connected!');
    socket.emit('benchmark_task', {
        test: "YAY!"
    });
});

socket.on('disconnect', (s) => {
    console.log('Disconnected!');
});

//var uploader = new SocketIOFile(socket);

// const testFile = path.resolve(path.join(__dirname, '/send-me.js'));
// uploader.on('ready', () => {
//     uploader.upload(testFile, {});
// });

// uploader.on('complete', () => {
//     console.log('yay!');
// });
