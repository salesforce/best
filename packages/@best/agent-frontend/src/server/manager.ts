import socketIO from 'socket.io';

const proxifyWithAfter = (object: any, method: string, fn: Function) => {
    const orig = object[method]
    object[method] = function (...args: any[]) {
        fn.apply(this, args)
        return orig.apply(this, args)
    }
}

const FRONTEND_EVENTS = ['benchmark_task', 'running_benchmark_start', 'running_benchmark_update', 'running_benchmark_end', 'benchmark_results']

export default class Manager {
    private frontends: socketIO.Socket[] = [];

    addFrontend(socket: socketIO.Socket) {
        const index = this.frontends.length;
        this.frontends.push(socket);

        socket.on('disconnect', () => {
            this.frontends.splice(index, 1);
        })
    }

    attachListeners(client: socketIO.Socket) {
        proxifyWithAfter(client, 'emit', (name: string, args: any) => {
            this.notifyFrontends(client.id, name, args);
        })
    
        client.use((event, next) => {
            this.notifyFrontends(client.id, event[0], event[1]);
            next();
        })
    }

    private notifyFrontends(socketId: any, name: string, args: any) {
        if (!FRONTEND_EVENTS.includes(name)) { return; }

        this.frontends.forEach(frontend => {
            frontend.emit(name, {
                socketId,
                args
            })
        })
    }
}
