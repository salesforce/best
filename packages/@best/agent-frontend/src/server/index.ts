/*
 * Copyright (c) 2019, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: MIT
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/MIT
*/

import path from 'path';
import express from 'express';
import socketIO from 'socket.io';
import Manager from './manager';
import AgentLogger from '@best/agent-logger';

export const serveFrontend = (app: express.Application) => {
    const DIST_DIR = path.resolve(__dirname, '../dist');

    app.use(express.static(DIST_DIR));
    app.get('*', (req, res) => res.sendFile(path.resolve(DIST_DIR, 'index.html')));
}

export const attachMiddleware = (server: socketIO.Server, logger: AgentLogger) => {
    const manager = new Manager(logger);

    server.on('connect', (socket: SocketIO.Socket) => {
        if (socket.handshake.query && socket.handshake.query.frontend) {
            manager.addFrontend(socket);
        }
    });
}
