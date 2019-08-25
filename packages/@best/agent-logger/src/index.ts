/*
 * Copyright (c) 2019, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: MIT
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/MIT
*/

import { EventEmitter } from 'events';
import chalk from 'chalk';
export { loggedSocket, LoggedSocket } from './socket';

const THROTTLE_WAIT = 750;

export default class AgentLogger extends EventEmitter {
    private agentId: string;
    private outputStream: NodeJS.WriteStream;
    private parent?: AgentLogger

    private pendingEvents = new Set<string>();

    constructor(agentId?: string, outputStream: NodeJS.WriteStream = process.stdout) {
        super();
        this.agentId = agentId || 'Hub';
        this.outputStream = outputStream;
    }

    withAgentId(agentId: string): AgentLogger {
        const child = new AgentLogger(agentId, this.outputStream);
        child.parent = this;
        return child;
    }

    // This function logs the event to the console, but does not emit the event
    error(jobId: string, name: string, packet?: any, logPacket: boolean = true) {
        this.log(jobId, chalk.bold.red(name), (packet && logPacket) ? JSON.stringify(packet) : null);
    }

    // This function logs the event to the console, but does not emit the event
    info(jobId: string, name: string, packet?: any, logPacket: boolean = true) {
        this.log(jobId, chalk.bold.cyan(name), (packet && logPacket) ? JSON.stringify(packet) : null);
    }
    
    // This function emits the event to all listeners of the logger
    // Optionally, if `log` true it will log the event as well.
    event(jobId: string, name: string, packet?: any, logPacket: boolean = true) {
        this.emitEvent(name, {
            agentId: this.agentId,
            jobId,
            packet
        })

        this.log(jobId, chalk.bold.green(name), (packet && logPacket) ? JSON.stringify(packet) : null)
    }

    // This function is similar to `event()` with two exceptions:
    // 1. It throttle emitting the event to listeners
    // 2. It will always log events, which is also throttled
    // NOTE: it only throttles events with the same jobId and name
    throttle(jobId: string, name: string, packet?: any, logPacket?: boolean) {
        const cacheKey = `${jobId},${name}`;

        if (!this.pendingEvents.has(cacheKey)) {
            this.pendingEvents.add(cacheKey);
            this.event(jobId, name, packet, logPacket);

            setTimeout(() => {
                this.pendingEvents.delete(cacheKey);
            }, THROTTLE_WAIT);
        }
    }

    private emitEvent(event: string, packet: any) {
        this.emit(event, packet);

        if (this.parent) this.parent.emitEvent(event, packet);
    }

    private log(jobId: string, name: string, packet?: any) {
        let message = `${chalk.gray(this.agentId)} Job[${chalk.bold(jobId)}]: ${name}`;

        if (packet) {
            message += ` - ${packet}`;
        }

        this.write(message);
    }

    private write(message: string) {
        this.outputStream.write(message + '\n');
    }
}