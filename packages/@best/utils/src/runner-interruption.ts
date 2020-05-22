/*
 * Copyright (c) 2019, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: MIT
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/MIT
 */
import { Interruption } from "@best/types";

export class RunnerInterruption implements Interruption {
    public requestedInterruption: boolean = false;
    public id?: string;

    constructor(id?: string) {
        this.id = id;
    }

    requestInterruption() {
        this.requestedInterruption = true;
    }
}
