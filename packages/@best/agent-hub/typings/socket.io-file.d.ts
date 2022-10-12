/*
 * Copyright (c) 2019, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: MIT
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/MIT
 */

declare module 'socket.io-file' {
    export default class SocketIO {
        on(arg0: string, arg1: ({ wrote, size }: any) => void): void;
        once(arg0: string, arg1: ({ wrote, size }: any) => void): void;
        removeListener(arg0: string, arg1: any): void;
        constructor(socket: any, config: any);
    }
}
