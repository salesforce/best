import { io } from 'socket.io-client';

export const connect = (...args: any[]) => {
    return io(...args);
};
