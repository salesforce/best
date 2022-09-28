/*
 * Copyright (c) 2019, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: MIT
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/MIT
 */

import SocketIOServer, { Socket } from 'socket.io';

import { BEST_RPC } from '@best/shared';
import { AgentConfig, BrowserSpec, RemoteHubConfig } from '@best/types';

import RemoteHub from '../remote-hub';

// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

// Test configurations.

const TEST_CONFIGS = {
    LABEL: 'REMOTE_HUB',
    SERVER_PORT: 3002,
    SERVER_URL: `http://localhost:3002`,
    SOCKET_PATH: '/agents',
};

// Helper functions.

const createClient = (configs: Object = {}) => {
    const agentConfig: AgentConfig = {
        options: {
            path: TEST_CONFIGS.SOCKET_PATH,
        },
        runner: '@best/runner-headless',
        uri: TEST_CONFIGS.SERVER_URL,
    };

    const remoteHubConfig: RemoteHubConfig = Object.assign(
        {},
        {
            acceptSelfSignedCert: true,
            authToken: 'test',
            pingTimeout: 1000,
            uri: TEST_CONFIGS.SERVER_URL,
        },
        configs,
    );

    const specs: BrowserSpec[] = [
        {
            name: 'chrome',
            version: '100',
        },
    ];

    // Create the client (RemoteHub).
    return new RemoteHub(remoteHubConfig, specs, agentConfig);
};

const generateLogMessage = (eventName: string) =>
    `[${TEST_CONFIGS.LABEL}(${TEST_CONFIGS.SERVER_URL})] - socket:${eventName}`;

// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

describe('Agent - Remote Hub', () => {
    let clientSocketManager: RemoteHub;
    let server: SocketIOServer.Server;
    let serverSocket: Socket;

    describe('disconnectFromHub()', () => {
        afterEach(() => {
            jest.clearAllMocks();
        });

        test('Should not trigger the disconnect as it was not connected', async () => {
            // Create client.
            clientSocketManager = createClient();

            const clientSocketManagerOnSpy = jest.spyOn(clientSocketManager, 'emit');

            // Make client try to disconnect itself.
            clientSocketManager.disconnectFromHub();

            // Should not emit anything as the client never connected to a server.
            expect(clientSocketManagerOnSpy).not.toBeCalled();
        });

        test('Should disconnect', async () => {
            // Create server.
            server = SocketIOServer(TEST_CONFIGS.SERVER_PORT, {
                path: TEST_CONFIGS.SOCKET_PATH,
            });

            const serverConnection = (): Promise<Socket> =>
                new Promise((resolve) => {
                    server.on('connection', resolve);
                });

            // Create client.
            clientSocketManager = createClient();

            const clientConnection = () =>
                new Promise((resolve) => {
                    clientSocketManager.on(BEST_RPC.AGENT_CONNECTED_HUB, resolve);
                });

            // Make client connect to server.
            clientSocketManager.connectToHub();

            // Wait for the client to actually connect to the server.
            serverSocket = await serverConnection();
            await clientConnection();

            const clientSocketManagerEmitSpy = jest.spyOn(clientSocketManager, 'emit');
            const consoleLogSpy = jest.spyOn(console, 'log');
            const serverSocketOnSpy = jest.spyOn(serverSocket, 'on');

            // Make client disconnect itself.
            clientSocketManager.disconnectFromHub();

            // Wait for the client to actually disconnect.
            await new Promise((resolve) => {
                serverSocket.on(BEST_RPC.AGENT_DISCONNECTED_HUB, resolve);
            });

            expect(clientSocketManagerEmitSpy).toHaveBeenCalledTimes(2);
            expect(clientSocketManagerEmitSpy).toHaveBeenNthCalledWith(1, BEST_RPC.AGENT_DISCONNECTED_HUB);
            expect(clientSocketManagerEmitSpy).toHaveBeenNthCalledWith(2, BEST_RPC.DISCONNECT, undefined);

            expect(consoleLogSpy).toHaveBeenCalledTimes(1);
            expect(consoleLogSpy).toHaveBeenNthCalledWith(
                1,
                generateLogMessage(BEST_RPC.DISCONNECT),
                'io client disconnect',
            );

            expect(serverSocketOnSpy).toHaveBeenCalledTimes(1);
            expect(serverSocketOnSpy).toHaveBeenNthCalledWith(1, BEST_RPC.AGENT_DISCONNECTED_HUB, expect.any(Function));

            // Make server close itself and wait for it to actually be closed.
            await new Promise((resolve: any) => {
                server.close(resolve);
            });
        });
    });

    describe('Tests where the server is provided', () => {
        let clientConnection: Function;
        let serverConnection: Function;

        // Helper functions.

        const connectToHub = async (configs = {}) => {
            // Create the client.
            clientSocketManager = createClient(configs);

            // Make client connect itself to the server.
            clientSocketManager.connectToHub();

            // Wait for the client to actually be connected.
            serverSocket = await serverConnection();
            await clientConnection();
        };

        afterEach(async () => {
            // If a client was created and it's connected to the server.
            if (clientSocketManager && serverSocket.connected) {
                // Make client disconnect itself.
                clientSocketManager.disconnectFromHub();

                // Wait for the client to actually disconnect.
                await new Promise((resolve: any) => {
                    serverSocket.on(BEST_RPC.DISCONNECT, resolve);
                });
            }

            // Make server close itself and wait for it to actually be closed.
            await new Promise((resolve: any) => {
                server.close(resolve);
            });

            jest.clearAllMocks();
        });

        beforeEach(() => {
            // Create server.
            server = SocketIOServer(TEST_CONFIGS.SERVER_PORT, {
                path: TEST_CONFIGS.SOCKET_PATH,
            });

            serverConnection = (): Promise<Socket> =>
                new Promise((resolve) => {
                    server.on('connection', resolve);
                });

            clientConnection = () =>
                new Promise((resolve) => {
                    clientSocketManager.on(BEST_RPC.AGENT_CONNECTED_HUB, resolve);
                });
        });

        describe('Constructor configs', () => {
            test(`Should not set the 'authToken' because a value was not provided`, async () => {
                const authToken = undefined;
                await connectToHub({ authToken });
                expect(serverSocket.handshake.query.authToken).toBeUndefined();
            });

            test(`Should set the 'authToken'`, async () => {
                const authToken = 'test authToken';
                await connectToHub({ authToken });
                expect(serverSocket.handshake.query.authToken).toBe(authToken);
            });
        });

        describe(`'${BEST_RPC.AGENT_REJECTION}' event`, () => {
            const event = BEST_RPC.AGENT_REJECTION;

            test(`Should handle '${event}' event`, async () => {
                const consoleLogSpy = jest.spyOn(console, 'log');
                const consoleLog = () => new Promise((resolve) => consoleLogSpy.mockImplementation(resolve));
                const message = `test ${event}`;

                await connectToHub();
                consoleLogSpy.mockClear();

                serverSocket.emit(event, message);
                await consoleLog();

                // expect(consoleLogSpy).toBeCalledTimes(1);
                expect(consoleLogSpy).toHaveBeenNthCalledWith(1, generateLogMessage(event), message);
            });
        });

        /*
         * The other events are reserved and should not be emitted
         * as above (+ in more recent versions of Socket.IO emitting
         * then throws an error).
         *
         * TODO: Find a way to trigger them?
         *       See also: https://socket.io/docs/v4/middlewares/#handling-middleware-error
         */

        describe('connectToHub()', () => {
            test('Should connect', async () => {
                const consoleLogSpy = jest.spyOn(console, 'log');

                await connectToHub();

                expect(consoleLogSpy).toBeCalledTimes(2);
                expect(consoleLogSpy).toHaveBeenNthCalledWith(
                    1,
                    `[${TEST_CONFIGS.LABEL}] Connecting To Hub: ${TEST_CONFIGS.SERVER_URL}`,
                );
                expect(consoleLogSpy).toHaveBeenNthCalledWith(
                    2,
                    `[${TEST_CONFIGS.LABEL}(${TEST_CONFIGS.SERVER_URL})] - socket:connect`,
                );
            });
        });

        describe(`getID()`, () => {
            test(`Should get the socket ID`, async () => {
                await connectToHub();
                expect(clientSocketManager.getId()).toBe(`[${TEST_CONFIGS.LABEL}(${TEST_CONFIGS.SERVER_URL})]`);
            });
        });

        describe(`toString()`, () => {
            test(`Should log message`, async () => {
                await connectToHub();
                expect(clientSocketManager.toString()).toBe(
                    `[${TEST_CONFIGS.LABEL}_[${TEST_CONFIGS.LABEL}(${TEST_CONFIGS.SERVER_URL})]]`,
                );
            });
        });
    });
});
