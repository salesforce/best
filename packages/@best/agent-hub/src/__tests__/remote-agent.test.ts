/*
 * Copyright (c) 2019, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: MIT
 * For full  license text, see the LICENSE file in the repo root or https://opensource.org/licenses/MIT
 */

import { Server, Socket as ServerSocket } from 'socket.io';
import { io as Client, Socket as ClientSocket } from 'socket.io-client';

import { RemoteClient } from '@best/agent';
import { BEST_RPC } from '@best/shared';
import { AgentState } from '@best/types';

jest.mock('@best/agent');

import RemoteAgent from '../remote-agent';

// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

// Test configurations.

const TEST_CONFIGS = {
    LABEL: 'REMOTE_AGENT',
    SERVER_PORT: 3003,
    SERVER_URL: `http://localhost:3003`,
    SOCKET_PATH: '/hub-remote-agent-test',
};

// Helper functions.

const getConfigs = () => {
    return {
        specs: {
            name: 'chrome.headless',
            version: '100',
        },
        token: 'token',
        uri: TEST_CONFIGS.SERVER_URL,
    };
};

// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

describe('Agent Hub - Remote Agent', () => {
    let clientSocket: ClientSocket;
    let server: Server;
    let serverSocket: ServerSocket;
    let serverSocketManager: RemoteAgent;

    afterEach(async () => {
        // If the client is connected to the server.
        if (serverSocketManager && serverSocket.connected) {
            // Make server disconnect the client.
            serverSocketManager.disconnectAgent();

            // Wait for the client to actually disconnect.
            await new Promise((resolve) => {
                clientSocket.on(BEST_RPC.DISCONNECT, resolve);
            });
        }

        // Close the server and wait for it to actually close.
        await new Promise((resolve: any) => {
            server.close(resolve);
        });

        jest.clearAllMocks();
    });

    beforeEach(async () => {
        // Create the server.
        server = new Server(TEST_CONFIGS.SERVER_PORT, {
            path: TEST_CONFIGS.SOCKET_PATH,
        });

        const serverConnection = (): Promise<ServerSocket> =>
            new Promise((resolve) => {
                server.on('connection', resolve);
            });

        // Create the client.
        clientSocket = Client(TEST_CONFIGS.SERVER_URL, {
            path: TEST_CONFIGS.SOCKET_PATH,

            /*
             * By default the value of `transports` is `['polling', 'websocket']`.
             * That makes Socket.IO first establish a long-polling connection, then
             * attempt to upgrade to websockets.
             *
             * For some reason if the upgrade to websockets is not done by the
             * time `socket.disconnect(true)` is done, it takes some time (~30s)
             * after the `server.close` callback is called for the server instance
             * to actually stop running.  `afterEach` could wait after the callback,
             * but that would increase the overall time tests take to run by a lot.
             *
             * So, since the transport layer is abstracted by Socker.IO anyways and
             * it doesn't matter as far as the following tests are concerned, using
             * `websocket` directly should be fine for this use case.
             *
             * Notes: When long-polling there doesn't seem to be an option that can be
             * passed to Socket.IO or the HTTP Server to force things so that the server
             * instance is actually stopped once the `server.close` callback is called.
             */

            transports: ['websocket'],
        });

        // Wait for the client to be connected to the server.
        serverSocket = await serverConnection();
    });

    // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

    describe(`'DISCONNECT' event`, () => {
        test('Should disconnect the agent', async () => {
            serverSocketManager = new RemoteAgent(serverSocket, getConfigs());

            const consoleLogSpy = jest.spyOn(console, 'log');
            // Mock the `disconnectAgent` function as it's tested separately.
            const serverSocketManagerDisconnectAgentSpy = jest
                .spyOn(serverSocketManager, 'disconnectAgent')
                .mockImplementationOnce(() => {});

            // Make server disconnect the client.
            serverSocket.disconnect(true);

            // Wait for the client to actually be disconnected.
            await new Promise((resolve) => {
                clientSocket.on('disconnect', resolve);
            });

            expect(serverSocketManagerDisconnectAgentSpy).toHaveBeenCalledTimes(1);
            expect(consoleLogSpy).toHaveBeenCalledTimes(1);
            expect(consoleLogSpy).toHaveBeenNthCalledWith(
                1,
                `${serverSocket.id} - socket:disconnect`,
                'server namespace disconnect',
            );
        });
    });

    describe('disconnectAgent()', () => {
        test('Should disconnect the agent', async () => {
            const serverSocketManager = new RemoteAgent(serverSocket, getConfigs());

            const serverSocketManagerEmitSpy = jest.spyOn(serverSocketManager, 'emit');
            const disconnectReason = 'test disconnect';
            const serverSocketEmitSpy = jest.spyOn(serverSocket, 'emit');

            // Make server disconnect the client.
            serverSocketManager.disconnectAgent(disconnectReason);

            // Wait for the client to actually be disconnected.
            await new Promise((resolve) => {
                clientSocket.on(BEST_RPC.DISCONNECT, resolve);
            });

            // Socket should be disconnected.
            expect(serverSocket.disconnected).toBe(true);

            expect(serverSocketEmitSpy).toHaveBeenCalledTimes(1);
            expect(serverSocketEmitSpy).toHaveBeenNthCalledWith(1, BEST_RPC.AGENT_REJECTION, disconnectReason);

            expect(serverSocketManagerEmitSpy).toHaveBeenCalledTimes(1);
            expect(serverSocketManagerEmitSpy).toHaveBeenNthCalledWith(1, BEST_RPC.DISCONNECT, disconnectReason);

            serverSocketEmitSpy.mockClear();
            serverSocketManagerEmitSpy.mockClear();

            // Make server disconnect the client again.
            serverSocketManager.disconnectAgent(disconnectReason);

            // This time nothing should done as the socket was disconnected.
            expect(serverSocketEmitSpy).toHaveBeenCalledTimes(0);
            expect(serverSocketManagerEmitSpy).toHaveBeenCalledTimes(0);
        });
    });

    describe('getId()', () => {
        test('Should return the socket ID', () => {
            serverSocketManager = new RemoteAgent(serverSocket, getConfigs());
            expect(serverSocketManager.getId()).toBe(serverSocket.id);
        });
    });

    describe('getSpecs()', () => {
        test('Should return the provided specs', () => {
            const configs = getConfigs();
            serverSocketManager = new RemoteAgent(serverSocket, configs);
            expect(serverSocketManager.getSpecs()).toEqual(expect.objectContaining(configs.specs));
        });
    });

    describe('getUri()', () => {
        test('Should return the provided URI', () => {
            const configs = getConfigs();
            serverSocketManager = new RemoteAgent(serverSocket, configs);
            expect(serverSocketManager.getUri()).toEqual(configs.uri);
        });
    });

    describe('isBusy()', () => {
        test('Should not be busy by default', () => {
            serverSocketManager = new RemoteAgent(serverSocket, getConfigs());
            expect(serverSocketManager.isBusy()).toBe(false);
        });
    });

    describe('isIdle()', () => {
        test('Should be idle by default', () => {
            serverSocketManager = new RemoteAgent(serverSocket, getConfigs());
            expect(serverSocketManager.isIdle()).toBe(true);
        });
    });

    describe('runBenchmarks()', () => {
        test('Should not run benchmarks as agent is not idle', async () => {
            serverSocketManager = new RemoteAgent(serverSocket, getConfigs());

            // @ts-ignore
            const remoteServerSocketManager = new RemoteClient(/* this is mocked */);
            const getPendingBenchmarksSpy = jest.spyOn(remoteServerSocketManager, 'getPendingBenchmarks');

            // Simulate not being idle.
            jest.spyOn(serverSocketManager, 'isIdle').mockImplementationOnce(() => false);

            await serverSocketManager.runBenchmarks(remoteServerSocketManager);

            /*
             * Note: It is called 1 time because the `jobsToRun`
             * parameter was not specified above.
             */
            expect(1).toBe(1);
            expect(getPendingBenchmarksSpy).toBeCalledTimes(1);
        });
    });

    describe('getState()', () => {
        test(`Should return the state having 'state' be '${AgentState.IDLE}'`, () => {
            const config = getConfigs();
            serverSocketManager = new RemoteAgent(serverSocket, config);

            expect(serverSocketManager.getState()).toEqual(
                expect.objectContaining({
                    agentId: serverSocket.id,
                    specs: config.specs,
                    state: AgentState.IDLE,
                    uri: config.uri,
                }),
            );
        });

        test(`Should return the state having 'state' be '${AgentState.BUSY}'`, () => {
            const config = getConfigs();
            serverSocketManager = new RemoteAgent(serverSocket, config);

            jest.spyOn(serverSocketManager, 'isIdle').mockImplementationOnce(() => false);

            expect(serverSocketManager.getState()).toEqual(
                expect.objectContaining({
                    agentId: serverSocket.id,
                    specs: config.specs,
                    state: AgentState.BUSY,
                    uri: config.uri,
                }),
            );
        });
    });

    describe('toString()', () => {
        test('Should return the ID as a string', () => {
            serverSocketManager = new RemoteAgent(serverSocket, getConfigs());
            expect(serverSocketManager.toString()).toEqual(`[${TEST_CONFIGS.LABEL}_${serverSocket.id}]`);
        });
    });
});
