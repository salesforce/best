/*
 * Copyright (c) 2019, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: MIT
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/MIT
 */

export interface ProxiedStream {
    unproxyStream(): void;
    readBuffer(): string;
    clearBuffer(): void;
    writeBuffer(msg?: string): void;
}

export function proxyStream(stream: any, isInteractive: boolean): ProxiedStream {
    const _originalWrite = stream.write;
    let proxyBuffer = '';
    if (isInteractive) {
        stream.write = (msg: string) => {
            proxyBuffer += msg;
        };
    }

    return {
        unproxyStream() {
            proxyBuffer = '';
            stream.write = _originalWrite;
        },
        readBuffer() {
            return proxyBuffer;
        },
        clearBuffer() {
            proxyBuffer = '';
        },
        writeBuffer(msg: string) {
            if (msg) {
                proxyBuffer += msg;
            }
        },
    };
}
