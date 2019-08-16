/*
 * Copyright (c) 2019, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: MIT
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/MIT
*/

import * as SocketIO from "socket.io";
import { Spec } from "./Agent";

export class Client {
    private _spec: Spec;
    private _socket: SocketIO.Socket;
    private _totalJobs: number = 0;

    constructor(socket: SocketIO.Socket, spec: Spec, totalJobs: number) {
        this._socket = socket;
        this._spec = spec;
        this._totalJobs = totalJobs;
    }

    get spec(): Spec {
        return this._spec;
    }

    set spec(value: Spec) {
        this._spec = value;
    }

    get jobsToRun() {
        return this._totalJobs;
    }

    set jobsToRun(value: number) {
        this._totalJobs = value;
    }

    askForJob() {
        this._socket.emit('new-job');
        this._totalJobs--;
    }

    notifyInQueue(clientsInQueue: number) {
        this._socket.emit('client-pending', clientsInQueue);
    }
}
