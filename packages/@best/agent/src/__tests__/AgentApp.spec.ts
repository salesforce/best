import ObservableQueue from "../utils/ObservableQueue";
import BenchmarkTask from "../BenchmarkTask";
import {AgentApp} from "../AgentApp";
import BenchmarkRunner, {RunnerStatus} from "../BenchmarkRunner";
import * as SocketIO from "socket.io";
import {EventEmitter} from "events";

const createTask = (idx: number) => {
    const SocketMock = jest.fn<SocketIO.Socket, any>();
    const socket = new SocketMock();

    return new BenchmarkTask({
        benchmarkName: 'name' + idx,
        benchmarkSignature: 'signature' + idx,
        projectConfig: 'project-config' + idx,
        globalConfig: 'global-config' + idx,
        socket
    });
};

describe('Agent app', () => {
    test('subscribes to queue.item-added and runner.idle-runner', async () => {
        const queue = new ObservableQueue<BenchmarkTask>();
        const queueOnSpy = jest.spyOn(queue, 'on');

        const runner = new BenchmarkRunner();
        const runnerOnSpy = jest.spyOn(runner, 'on');

        const agentApp = new AgentApp(queue, runner);

        expect(queueOnSpy).toHaveBeenCalled();
        expect(queueOnSpy.mock.calls[0][0]).toBe('item-added');

        expect(runnerOnSpy).toHaveBeenCalled();
        expect(runnerOnSpy.mock.calls[0][0]).toBe('idle-runner');
    });

    describe('adding items to the queue', () => {
        test('runs task when queue is empty', async () => {
            const queue = new ObservableQueue<BenchmarkTask>();
            const queueRemoveSpy = jest.spyOn(queue, 'remove');

            const runner = new BenchmarkRunner();
            runner.run = jest.fn();

            const runnerRunSpy = jest.spyOn(runner, 'run');

            const agentApp = new AgentApp(queue, runner);

            const task = createTask(1);

            queue.push(task);

            expect(runner.run).toHaveBeenCalled();
            expect(runnerRunSpy.mock.calls[0][0]).toBe(task);

            expect(queueRemoveSpy).toHaveBeenCalled();
            expect(runnerRunSpy.mock.calls[0][0]).toBe(task);
        });

        test('if runner is running a task informs client that the job is added to the queue', async () => {
            const queue = new ObservableQueue<BenchmarkTask>();

            const runner = new BenchmarkRunner();
            runner.status = RunnerStatus.RUNNING;
            runner.run = jest.fn();
            const runnerRunSpy = jest.spyOn(runner, 'run');

            const agentApp = new AgentApp(queue, runner);

            const task = createTask(1);
            task.socketConnection.emit = jest.fn();
            const socketEmitSpy = jest.spyOn(task.socketConnection, 'emit');

            queue.push(task);

            expect(runnerRunSpy).not.toHaveBeenCalled();

            expect(socketEmitSpy).toHaveBeenCalled();
            expect(socketEmitSpy.mock.calls[0][0]).toBe('benchmark_enqueued');
            expect(socketEmitSpy.mock.calls[0][1]).toEqual({ pending: 1 });
        });
    });

    describe('runner becomes idle', () => {
        test('runs the next task in the queue', async () => {
            const queue = new ObservableQueue<BenchmarkTask>();

            const task1 = createTask(1);
            const task2 = createTask(2);

            queue.push(task1);
            queue.push(task2);

            const runner = new BenchmarkRunner();
            runner.status = RunnerStatus.RUNNING;
            runner.run = jest.fn();
            const runnerRunSpy = jest.spyOn(runner, 'run');

            const agentApp = new AgentApp(queue, runner);

            runner.status = RunnerStatus.IDLE;

            expect(runnerRunSpy).toHaveBeenCalled();
            expect(runnerRunSpy.mock.calls[0][0]).toBe(task1);

            expect(queue.size).toBe(1);
        });
    })

    describe('incoming socket connection', () => {
        test('listen for benchmark_task event', async () => {
            const queue = new ObservableQueue<BenchmarkTask>();
            const runner = new BenchmarkRunner();

            const agentApp = new AgentApp(queue, runner);

            const SocketMock = jest.fn<SocketIO.Socket, any>();
            const socket = new SocketMock();

            socket.on = jest.fn();
            const socketOnSpy = jest.spyOn(socket, 'on');

            agentApp.handleIncomingConnection(socket);

            expect(socketOnSpy).toHaveBeenCalled();
            expect(socketOnSpy.mock.calls[0][0]).toBe('benchmark_task');
        });

        test('on benchmark_task adds task to the queue and listens for disconnect event on socket', async () => {
            const queue = new ObservableQueue<BenchmarkTask>();
            queue.push = jest.fn();
            const queuePushSpy = jest.spyOn(queue, 'push');

            const runner = new BenchmarkRunner();

            const agentApp = new AgentApp(queue, runner);

            const SocketMock = jest.fn<SocketIO.Socket, any>();
            const socket = new SocketMock();

            const eventEmitter = new EventEmitter();
            socket.on = jest.fn((evt: string, fn: (...args: any[]) => void): SocketIO.Socket => {
                eventEmitter.on(evt, fn);
                return socket;
            });

            const socketOnSpy = jest.spyOn(socket, 'on');

            agentApp.handleIncomingConnection(socket);

            socketOnSpy.mockReset();

            eventEmitter.emit('benchmark_task', {
                benchmarkName: 'name',
                benchmarkSignature: 'signature',
                projectConfig: 'project-config',
                globalConfig: 'global-config',
                socket
            });

            expect(socketOnSpy).toHaveBeenCalled();
            expect(socketOnSpy.mock.calls[0][0]).toBe('disconnect');

            expect(queuePushSpy).toHaveBeenCalled();
            const task: BenchmarkTask = queuePushSpy.mock.calls[0][0];
            expect(task.benchmarkName).toBe('name');
            expect(task.benchmarkSignature).toBe('signature');
            expect(task.globalConfig).toBe('global-config');
            expect(task.projectConfig).toBe('project-config');
            expect(task.socketConnection).toBe(socket);
        });

        test('on socket.disconnect removes task from queue and runner', async () => {
            const queue = new ObservableQueue<BenchmarkTask>();
            queue.push = jest.fn();
            queue.remove = jest.fn();
            const queueRemoveSpy = jest.spyOn(queue, 'remove');

            const runner = new BenchmarkRunner();
            runner.cancelRun = jest.fn();
            const runnerCancelRunSpy = jest.spyOn(runner, 'cancelRun');

            const agentApp = new AgentApp(queue, runner);

            const SocketMock = jest.fn<SocketIO.Socket, any>();
            const socket = new SocketMock();

            const eventEmitter = new EventEmitter();
            socket.on = jest.fn((evt: string, fn: (...args: any[]) => void): SocketIO.Socket => {
                eventEmitter.on(evt, fn);
                return socket;
            });

            agentApp.handleIncomingConnection(socket);

            eventEmitter.emit('benchmark_task', {
                benchmarkName: 'name',
                benchmarkSignature: 'signature',
                projectConfig: 'project-config',
                globalConfig: 'global-config',
                socket
            });

            eventEmitter.emit('disconnect');

            expect(queueRemoveSpy).toHaveBeenCalled();
            const task = queueRemoveSpy.mock.calls[0][0];

            expect(task.socketConnection).toBe(socket);

            const taskFromRunner = runnerCancelRunSpy.mock.calls[0][0];
            expect(taskFromRunner.socketConnection).toBe(socket);
        });
    })
});

