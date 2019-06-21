
declare module 'socket.io-file' {
    export default class SocketIO {
        on(arg0: string, arg1: ({ wrote, size }: any) => void): void;
        destroy(): void;
        constructor(socket: any, config: any);
    }
}
