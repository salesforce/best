/*
 * Copyright (c) 2019, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: MIT
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/MIT
*/

import * as SocketIO from "socket.io";
import { BuildConfig, GlobalConfig, ProjectConfig } from "@best/types";

export default class BenchmarkTask {
    public projectConfig: ProjectConfig;
    public globalConfig: GlobalConfig;
    public socketConnection: SocketIO.Socket;
    private readonly _taskConfig: BuildConfig;

    constructor(taskConfig: BuildConfig, socket: SocketIO.Socket) {
        this._taskConfig = taskConfig;

        this.projectConfig = taskConfig.projectConfig;
        this.globalConfig = taskConfig.globalConfig;
        this.socketConnection = socket;
    }

    get config() {
        return this._taskConfig;
    }

    get benchmarkName() {
        return this._taskConfig.benchmarkName;
    }

    get benchmarkSignature() {
        return this._taskConfig.benchmarkSignature;
    }

    set benchmarkEntry(value: string) {
        this._taskConfig.benchmarkEntry = value;
    }

    set benchmarkFolder(value: string) {
        this._taskConfig.benchmarkFolder = value;
    }
}
