import path from 'path';
import express from 'express';
import socketIO from 'socket.io';
import Manager from './manager';

export const serveFrontend = (app: express.Application) => {
    const DIST_DIR = path.resolve(__dirname, '../dist');

    app.use(express.static(DIST_DIR));
    app.get('*', (req, res) => res.sendFile(path.resolve(DIST_DIR, 'index.html')));
}

export const attachMiddleware = (server: socketIO.Server) => {
    const manager = new Manager();

    server.on('connect', (socket: SocketIO.Socket) => {
        if (socket.handshake.query && socket.handshake.query.frontend) {
            manager.addFrontend(socket);
        } else {
            manager.attachListeners(socket);
        }
    });
}
