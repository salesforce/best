import { EventEmitter } from 'events';
import chalk from 'chalk';
import { memoizedThrottle } from './utils/decorators';

const THROTTLE_WAIT = 500;

export default class AgentLogger extends EventEmitter {
    private agentId: string;
    private outputStream: NodeJS.WriteStream;

    constructor(agentId?: string, outputStream: NodeJS.WriteStream = process.stdout) {
        super();
        this.agentId = agentId || 'Hub';
        this.outputStream = outputStream;
    }

    // This function logs the event to the console, but does not emit the event
    info(jobId: string, name: string, packet?: any, logPacket: boolean = true, agentId: string = this.agentId) {
        this.log(false, jobId, name, agentId, (packet && logPacket) ? JSON.stringify(packet) : null);
    }
    
    // This function emits the event to all listeners of the logger
    // Optionally, if `log` true it will log the event as well.
    event(jobId: string, name: string, packet?: any, logPacket: boolean = true, agentId: string = this.agentId) {
        this.emit(name, {
            agentId,
            jobId,
            packet
        })

        this.log(true, jobId, name, agentId, (packet && logPacket) ? JSON.stringify(packet) : null)
    }

    // This function is similar to `event()` with two exceptions:
    // 1. It throttle emitting the event to listeners
    // 2. It will always log events, which is also throttled
    // NOTE: it throttles events with the same jobId and name
    @memoizedThrottle(THROTTLE_WAIT, { length: 2 })
    throttle(jobId: string, name: string, packet?: any, logPacket?: boolean, agentId: string = this.agentId) {
        this.event(jobId, name, packet, logPacket, agentId);
    }

    private log(event: boolean, jobId: string, name: string, agentId: string, packet?: any) {
        let message = `${chalk.gray(agentId)} Job[${chalk.bold(jobId)}]: `;

        if (event) {
            message += chalk.bold.green(name);
        } else {
            message += chalk.bold.cyan(name);
        }

        if (packet) {
            message += ` - ${packet}`;
        }

        this.write(message);
    }

    private write(message: string) {
        this.outputStream.write(message + '\n');
    }
}