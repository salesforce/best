/*
 * Copyright (c) 2019, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: MIT
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/MIT
 */

import { Server } from 'http';
import path from 'path';

import express from 'express';
import { Server as SocketIOServer, Socket as ServerSocket } from 'socket.io';

import { BEST_RPC } from '@best/shared';
import { BestAgent } from '@best/types';

export function serveFrontend(app: express.Application) {
    const DIST_DIR = path.resolve(__dirname, '../../dist');

    app.use(express.static(DIST_DIR));
    app.get('*', (req, res) => res.sendFile(path.resolve(DIST_DIR, 'index.html')));
}

const FrontendSockets: Set<ServerSocket> = new Set();

function forwardEvent(eventType: string, ...args: any[]) {
    for (const socket of FrontendSockets) {
        socket.emit.apply(socket, [eventType, ...args]);
    }
}

const {
    AGENT_CONNECTED_CLIENT,
    AGENT_DISCONNECTED_CLIENT,
    AGENT_QUEUED_CLIENT,
    BENCHMARK_END,
    BENCHMARK_START,
    BENCHMARK_UPDATE,
    HUB_CONNECTED_AGENT,
    HUB_DISCONNECTED_AGENT,
} = BEST_RPC;
const FORWARD_EVENTS = [
    AGENT_CONNECTED_CLIENT,
    AGENT_DISCONNECTED_CLIENT,
    AGENT_QUEUED_CLIENT,
    BENCHMARK_END,
    BENCHMARK_START,
    BENCHMARK_UPDATE,
    HUB_CONNECTED_AGENT,
    HUB_DISCONNECTED_AGENT,
];

export function observeAgent(server: Server, agent: BestAgent) {
    // Instanciate a new socketServer on a dedicated path
    const socketServer = new SocketIOServer(server, { path: '/frontend' });

    // Listen for the needed events on the agent
    FORWARD_EVENTS.forEach((event) => agent.on(event, forwardEvent.bind(null, event)));

    // Manage connections
    socketServer.on('connect', (socket: ServerSocket) => {
        console.log(`[AGENT_FE] Adding Frontend socket ${socket.id} | active: ${FrontendSockets.size}`);
        socket.emit(BEST_RPC.AGENT_STATE, agent.getState());
        FrontendSockets.add(socket);
        socket.on('disconnect', () => {
            FrontendSockets.delete(socket);
            console.log(`[AGENT_FE] Disconnecting Frontend socket ${socket.id} | remaining: ${FrontendSockets.size}`);
        });
    });
}
