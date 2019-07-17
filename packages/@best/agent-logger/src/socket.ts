import AgentLogger from './index';
import { sanitize } from './utils/sanitize';

interface LoggedSocket {
    rawSocket: SocketIO.Socket;
    on(event: string, listener: (...args: any[]) => void): void;
    once(event: string, listener: (...args: any[]) => void): void;
    emit(event: string, ...args: any[]): boolean;
    disconnect( close?: boolean ): SocketIO.Socket;
}

export const loggedSocket = (rawSocket: SocketIO.Socket, logger: AgentLogger): LoggedSocket => {
    return {
        rawSocket,
        emit(name: string, ...args: any[]): boolean {
            const event = sanitize(name, args);
            logger.throttle(rawSocket.id, event.name, event.packet, false);
            
            return rawSocket.emit.apply(rawSocket, [name, ...args]);
        },
        on(event: string, listener: (...args: any[]) => void): void {
            rawSocket.on.apply(rawSocket, [event, listener]);
        },
        once(event: string, listener: (...args: any[]) => void): void {
            rawSocket.once.apply(rawSocket, [event, listener]);
        },
        disconnect(close?: boolean): SocketIO.Socket {
            return rawSocket.disconnect.apply(rawSocket);
        }
    }
}
