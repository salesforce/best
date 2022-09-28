/*
 * Copyright (c) 2019, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: MIT
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/MIT
 */

import SocketIOServer, { Socket } from 'socket.io';
import SocketIOClient from 'socket.io-client';

import { BEST_RPC } from '@best/shared';
import { AgentState, RemoteClientConfig } from '@best/types';

import RemoteClient from '../remote-client';

// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

// Test configurations.

const TEST_CONFIGS = {
    LABEL: '[AGENT_REMOTE_CLIENT]',
    SERVER_PORT: 3001,
    SERVER_URL: `http://localhost:3001`,
    SOCKET_PATH: '/agents',
};

// Helper functions.

const getConfigs = (): RemoteClientConfig => {
    return {
        specs: {
            name: 'chrome.headless',
            version: '100',
        },
        jobs: 1,
    };
};

const getId = (socket: Socket): String => `REMOTE_CLIENT_${socket.id}`;

// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

describe('Agent - Remote Client', () => {
    let clientSocket: SocketIOClient.Socket;
    let server: SocketIOServer.Server;
    let serverSocket: Socket;
    let serverSocketManager: RemoteClient;

    afterEach(async () => {
        // If the client is connected to the server.
        if (serverSocketManager && serverSocket.connected) {
            // Make server disconnect the client.
            serverSocketManager.disconnectClient();

            // Wait for the client to actually disconnect.
            await new Promise((reserve) => {
                clientSocket.on(BEST_RPC.DISCONNECT, reserve);
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
        server = SocketIOServer(TEST_CONFIGS.SERVER_PORT, {
            path: TEST_CONFIGS.SOCKET_PATH,
        });

        const serverConnection = (): Promise<Socket> =>
            new Promise((resolve) => {
                server.on('connection', resolve);
            });

        // Create the client.
        clientSocket = SocketIOClient(TEST_CONFIGS.SERVER_URL, {
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

    describe('disconnectClient()', () => {
        test('Should disconnect the client', async () => {
            const disconnectReason = 'test disconnect';
            serverSocketManager = new RemoteClient(serverSocket, getConfigs());

            const serverSocketManagerEmitSpy = jest.spyOn(serverSocketManager, 'emit');
            const serverSocketEmitSpy = jest.spyOn(serverSocket, 'emit');

            // Make server disconnect the client.
            serverSocketManager.disconnectClient(disconnectReason);

            // Wait for the client to actually be disconnected.
            await new Promise((resolve) => {
                clientSocket.on(BEST_RPC.DISCONNECT, resolve);
            });

            // Socket should be disconnected.
            expect(serverSocket.disconnected).toBe(true);

            expect(serverSocketManagerEmitSpy).toHaveBeenCalledTimes(1);
            expect(serverSocketManagerEmitSpy).toHaveBeenNthCalledWith(1, BEST_RPC.DISCONNECT, disconnectReason);

            expect(serverSocketEmitSpy).toHaveBeenCalledTimes(3);
            expect(serverSocketEmitSpy).toHaveBeenNthCalledWith(1, BEST_RPC.AGENT_REJECTION, disconnectReason);
            expect(serverSocketEmitSpy).toHaveBeenNthCalledWith(2, 'disconnecting', 'server namespace disconnect');
            expect(serverSocketEmitSpy).toHaveBeenNthCalledWith(3, 'disconnect', 'server namespace disconnect');

            serverSocketManagerEmitSpy.mockClear();
            serverSocketEmitSpy.mockClear();

            // Make server disconnect the client again.
            serverSocketManager.disconnectClient(disconnectReason);

            // This time nothing should be done as the socket was disconnected.
            expect(serverSocketManagerEmitSpy).toHaveBeenCalledTimes(0);
            expect(serverSocketEmitSpy).toHaveBeenCalledTimes(0);
        });
    });

    describe('finish()', () => {
        test('Should log the finish message', () => {
            const consoleLogSpy = jest.spyOn(console, 'log');
            serverSocketManager = new RemoteClient(serverSocket, getConfigs());

            serverSocketManager.finish();

            expect(consoleLogSpy).toHaveBeenCalledTimes(1);
            expect(consoleLogSpy).toHaveBeenNthCalledWith(1, `${TEST_CONFIGS.LABEL} finishingRunner`);
        });
    });

    describe('getId()', () => {
        test('Should return the socket ID', () => {
            serverSocketManager = new RemoteClient(serverSocket, getConfigs());
            expect(serverSocketManager.getId()).toBe(getId(serverSocket));
        });
    });

    describe('getPendingBenchmarks()', () => {
        test('Should return the number of pending benchmarks', () => {
            const configs = getConfigs();
            serverSocketManager = new RemoteClient(serverSocket, configs);
            expect(serverSocketManager.getPendingBenchmarks()).toBe(configs.jobs);
        });
    });

    describe('getSpecs()', () => {
        test('Should return the specs', () => {
            const configs = getConfigs();
            serverSocketManager = new RemoteClient(serverSocket, configs);
            expect(serverSocketManager.getSpecs()).toEqual(expect.objectContaining(configs.specs));
        });
    });

    describe('getState()', () => {
        test(`Should return the state having 'state' be '${AgentState.IDLE}'`, () => {
            const configs = getConfigs();
            serverSocketManager = new RemoteClient(serverSocket, configs);
            jest.spyOn(serverSocketManager, 'isIdle').mockImplementationOnce(() => true);

            expect(serverSocketManager.getState()).toEqual(
                expect.objectContaining({
                    state: AgentState.IDLE,
                    clientId: getId(serverSocket),
                    specs: configs.specs,
                    jobs: configs.jobs,
                }),
            );
        });

        test(`Should return the state having 'state' be '${AgentState.BUSY}'`, () => {
            const configs = getConfigs();
            serverSocketManager = new RemoteClient(serverSocket, configs);
            jest.spyOn(serverSocketManager, 'isIdle').mockImplementationOnce(() => false);

            expect(serverSocketManager.getState()).toEqual(
                expect.objectContaining({
                    state: AgentState.BUSY,
                    clientId: getId(serverSocket),
                    specs: configs.specs,
                    jobs: configs.jobs,
                }),
            );
        });
    });

    describe('getStatusInfo()', () => {
        test('Should return the status information', () => {
            const configs = getConfigs();
            const expectedStatusInfo = `remining jobs: ${configs.jobs} | specs: ${configs.specs} | state: ${AgentState.IDLE}`;

            serverSocketManager = new RemoteClient(serverSocket, configs);
            expect(serverSocketManager.getStatusInfo()).toEqual(expectedStatusInfo);
        });
    });

    describe('init()', () => {
        test('Should log the init message', () => {
            const consoleLogSpy = jest.spyOn(console, 'log');
            serverSocketManager = new RemoteClient(serverSocket, getConfigs());

            serverSocketManager.init();

            expect(consoleLogSpy).toHaveBeenCalledTimes(1);
            expect(consoleLogSpy).toHaveBeenNthCalledWith(1, `${TEST_CONFIGS.LABEL} startingRunner`);
        });
    });

    describe('isBusy()', () => {
        test('Should not be busy by default', () => {
            serverSocketManager = new RemoteClient(serverSocket, getConfigs());
            expect(serverSocketManager.isBusy()).toBe(false);
        });

        test('Should be busy', () => {
            serverSocketManager = new RemoteClient(serverSocket, getConfigs());
            jest.spyOn(serverSocketManager, 'isIdle').mockImplementationOnce(() => true);
            expect(serverSocketManager.isIdle()).toBe(true);
        });
    });

    describe('isIdle()', () => {
        test('Should be idle by default', () => {
            serverSocketManager = new RemoteClient(serverSocket, getConfigs());
            expect(serverSocketManager.isIdle()).toBe(true);
        });
    });

    describe('log()', () => {
        test('Should log the message', async () => {
            const message = 'test log';
            serverSocketManager = new RemoteClient(serverSocket, getConfigs());

            serverSocketManager.log(message);

            const receivedMessage = await new Promise((resolve) => {
                clientSocket.on(BEST_RPC.BENCHMARK_LOG, (message: string) => {
                    resolve(message);
                });
            });

            expect(receivedMessage).toBe(message);
        });

        test('Should not log the message as the client is not connected', async () => {
            const message = 'test log';
            serverSocketManager = new RemoteClient(serverSocket, getConfigs());

            // Make server disconnect the client.
            serverSocketManager.disconnectClient();

            // Wait for the client to actually be disconnected.
            await new Promise((resolve) => {
                clientSocket.on(BEST_RPC.DISCONNECT, resolve);
            });

            const clientSocketOnSpy = jest.spyOn(clientSocket, 'on');

            serverSocketManager.log(message);

            expect(clientSocketOnSpy).not.toBeCalled();
        });
    });

    describe('onBenchmarkEnd()', () => {
        test('Should log the benchmark end message', async () => {
            serverSocketManager = new RemoteClient(serverSocket, getConfigs());

            const benchmarkSignature = 'test onBenchmarkEnd';
            const consoleLogSpy = jest.spyOn(console, 'log');

            const clientSocketOnMessage = new Promise((resolve) => {
                clientSocket.on(BEST_RPC.BENCHMARK_END, (message: string) => {
                    resolve(message);
                });
            });

            const serverSocketManagerOnMessage = new Promise((resolve) => {
                serverSocketManager.on(BEST_RPC.BENCHMARK_END, (message: string) => {
                    resolve(message);
                });
            });

            serverSocketManager.onBenchmarkEnd(benchmarkSignature);

            expect(await clientSocketOnMessage).toBe(benchmarkSignature);
            expect(await serverSocketManagerOnMessage).toBe(benchmarkSignature);

            expect(consoleLogSpy).toHaveBeenCalledTimes(1);
            expect(consoleLogSpy).toHaveBeenNthCalledWith(
                1,
                `${TEST_CONFIGS.LABEL} benchmarkEnd(${benchmarkSignature})`,
            );
        });

        test('Should not emit anything as the client is not connected', async () => {
            serverSocketManager = new RemoteClient(serverSocket, getConfigs());

            const benchmarkSignature = 'test onBenchmarkEnd';

            // Make server disconnect the client.
            serverSocketManager.disconnectClient();

            // Wait for the client to actually be disconnected.
            await new Promise((resolve) => {
                clientSocket.on(BEST_RPC.DISCONNECT, resolve);
            });

            const clientSocketOnSpy = jest.spyOn(clientSocket, 'on');

            serverSocketManager.onBenchmarkEnd(benchmarkSignature);

            expect(clientSocketOnSpy).not.toBeCalled();
        });
    });

    describe('onBenchmarkError()', () => {
        test('Should log the benchmark error message', async () => {
            serverSocketManager = new RemoteClient(serverSocket, getConfigs());

            const benchmarkSignature = 'test BENCHMARK_ERROR';
            const clientSocketdOnMessage = new Promise((resolve) => {
                clientSocket.on(BEST_RPC.BENCHMARK_ERROR, (message: string) => {
                    resolve(message);
                });
            });
            const serverSocketManagerOnMessage = new Promise((resolve) => {
                serverSocketManager.on(BEST_RPC.BENCHMARK_ERROR, (message: string) => {
                    resolve(message);
                });
            });
            const consoleLogSpy = jest.spyOn(console, 'log');

            serverSocketManager.onBenchmarkError(benchmarkSignature);

            expect(await clientSocketdOnMessage).toBe(benchmarkSignature);
            expect(await serverSocketManagerOnMessage).toBe(benchmarkSignature);
            expect(consoleLogSpy).toHaveBeenCalledTimes(0);
        });

        test('Should not emit anything as the client is not connected', async () => {
            serverSocketManager = new RemoteClient(serverSocket, getConfigs());

            const benchmarkSignature = 'test onBenchmarkError';

            // Make server disconnect the client.
            serverSocketManager.disconnectClient();

            // Wait for the client to actually be disconnected.
            await new Promise((done) => {
                clientSocket.on(BEST_RPC.DISCONNECT, done);
            });

            const clientSocketOnSpy = jest.spyOn(clientSocket, 'on');

            serverSocketManager.onBenchmarkError(benchmarkSignature);

            expect(clientSocketOnSpy).not.toBeCalled();
        });
    });

    describe('onBenchmarkStart()', () => {
        test('Should log the benchmark start message', async () => {
            serverSocketManager = new RemoteClient(serverSocket, getConfigs());

            const benchmarkSignature = 'test onBenchmarkStart';
            const clientOnSocketMessage = new Promise((resolve) => {
                clientSocket.on(BEST_RPC.BENCHMARK_START, (message: string) => {
                    resolve(message);
                });
            });
            const serverSocketManagerOnMessage = new Promise((resolve) => {
                serverSocketManager.on(BEST_RPC.BENCHMARK_START, (message: string) => {
                    resolve(message);
                });
            });
            const consoleLogSpy = jest.spyOn(console, 'log');

            serverSocketManager.onBenchmarkStart(benchmarkSignature);

            expect(await clientOnSocketMessage).toBe(benchmarkSignature);
            expect(await serverSocketManagerOnMessage).toBe(benchmarkSignature);

            expect(consoleLogSpy).toHaveBeenCalledTimes(1);
            expect(consoleLogSpy).toHaveBeenNthCalledWith(
                1,
                `${TEST_CONFIGS.LABEL} benchmarkStart(${benchmarkSignature})`,
            );
        });

        test('Should not emit anything as the client is not connected', async () => {
            serverSocketManager = new RemoteClient(serverSocket, getConfigs());

            const benchmarkSignature = 'test onBenchmarkEnd';

            // Make server disconnect the client.
            serverSocketManager.disconnectClient();

            // Wait for the client to actually be disconnected.
            await new Promise((resolve) => {
                clientSocket.on(BEST_RPC.DISCONNECT, resolve);
            });

            const clientOnSpy = jest.spyOn(clientSocket, 'on');

            serverSocketManager.onBenchmarkStart(benchmarkSignature);

            expect(clientOnSpy).not.toBeCalled();
        });
    });

    describe('requestJob()', () => {
        test(`Should not request job as it is not idle`, async () => {
            serverSocketManager = new RemoteClient(serverSocket, getConfigs());
            jest.spyOn(serverSocketManager, 'isIdle').mockImplementationOnce(() => false);
            expect(serverSocketManager.requestJob()).rejects.toMatch('RemoteClient is busy');
        });
    });

    describe('sendResults()', () => {
        test(`Should send the results`, async () => {
            const message = 'test sendResults';
            serverSocketManager = new RemoteClient(serverSocket, getConfigs());

            const consoleLogSpy = jest.spyOn(console, 'log');

            const clientSocketOnMessage = () =>
                new Promise((resolve) => {
                    clientSocket.on(BEST_RPC.BENCHMARK_RESULTS, (message: string) => {
                        resolve(message);
                    });
                });

            serverSocketManager.sendResults(message);

            expect(await clientSocketOnMessage()).toBe(message);

            expect(consoleLogSpy).toHaveBeenCalledTimes(1);
            expect(consoleLogSpy).toHaveBeenNthCalledWith(1, `${TEST_CONFIGS.LABEL} Sending Results | pending: -1`);
        });
    });

    describe('toString()', () => {
        test('Should return the ID as a string', () => {
            serverSocketManager = new RemoteClient(serverSocket, getConfigs());
            expect(serverSocketManager.toString()).toBe(getId(serverSocket));
        });
    });
});
