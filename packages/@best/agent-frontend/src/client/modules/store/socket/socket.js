import io from 'socket.io-client';

export const connect = (...args) => {
    return io.connect(...args);
}