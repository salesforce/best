/*
 * Copyright (c) 2019, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: MIT
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/MIT
*/

import path from 'path';
import express from 'express';
import socketIO from "socket.io";
import { Server } from 'http';
import { BestAgent } from "@best/types";
import { BEST_RPC } from "@best/shared";

export const serveFrontend = (app: express.Application) => {
    const DIST_DIR = path.resolve(__dirname, '../dist');

    app.use(express.static(DIST_DIR));
    app.get('*', (req, res) => res.sendFile(path.resolve(DIST_DIR, 'index.html')));
}

export const observeAgent = (server: Server, agent: BestAgent) => {
    const socketServer = socketIO(server, { path: '/frontend' });
    socketServer.on('connect', (socket: SocketIO.Socket) => {
        agent.on(BEST_RPC.AGENT_CONNECTED_CLIENT, (args) => socket.emit(BEST_RPC.AGENT_CONNECTED_CLIENT, args));
        agent.on(BEST_RPC.AGENT_DISCONNECTED_CLIENT, (args) => socket.emit(BEST_RPC.AGENT_DISCONNECTED_CLIENT, args));
        agent.on(BEST_RPC.BENCHMARK_START, (args) => socket.emit(BEST_RPC.BENCHMARK_START, args));
        agent.on(BEST_RPC.BENCHMARK_END, (args) => socket.emit(BEST_RPC.BENCHMARK_END, args));

        // TODO: Disconnect all event handlers from agent
    });
}
