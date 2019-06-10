import socketIO, * as SocketIO from 'socket.io';
import {cacheDirectory} from '@best/utils';
import BenchmarkJob from "./BenchmarkJob";
import ObservableQueue from "./utils/ObservableQueue";
import path from "path";
import SocketIOFile from "socket.io-file";
import {config} from "./hub-config";
import {Agent, AgentStatus} from "./Agent";

// This is all part of the initialization
const LOADER_CONFIG = {
    uploadDir: path.join(cacheDirectory('best_agent'), 'uploads'),
    accepts: [],
    maxFileSize: 52428800, // 50 mb
    chunkSize: 10240, // 10kb
    transmissionDelay: 0,
    overwrite: true,
};

const agents: Agent[] = config.agents.map((agentConfig) => new Agent(agentConfig));

agents.forEach((agent: Agent) => {
    agent.on('statuschanged', ({ newValue }: { newValue: AgentStatus }) => {
        if (newValue === AgentStatus.Idle) {
            // we can run a job in this agent, lets loop and see

            for (const job of readyQueue) {
                if (agent.canRunJob(job!)) {
                    readyQueue.remove(job!);
                    agent.runJob(job!);
                    break;
                }
            }
        }
    })
});

const incomingQueue = new ObservableQueue<BenchmarkJob>();
const readyQueue = new ObservableQueue<BenchmarkJob>();

incomingQueue.on('item-added', (job: BenchmarkJob) => {
    // upload the file, and set the job in the proper queue;

    const socket = job.socketConnection;

    const uploader = new SocketIOFile(socket, LOADER_CONFIG);
    const listener = (info: any) => {
        if (info.data['jobId'] === job.jobId) {
            uploader.removeListener('complete', listener);
            // set the job file, move from the incoming queue to the ready queue
            job.tarBundle = info.uploadDir;

            incomingQueue.remove(job);
            readyQueue.push(job);
        }
    };

    uploader.on('complete', listener);

    uploader.once('error', (err: any) => {
        // move to the error queue
        console.log(err);
    });

    incomingQueue.remove(job);
    socket.emit('load_benchmark', job.jobId);
});

readyQueue.on('item-added', (job: BenchmarkJob) => {
    console.log("Job is ready to be processed", job.jobId);
    const idleAgents = agents.filter(agent => agent.isIdle() && agent.canRunJob(job));

    if (idleAgents.length > 0) {
        readyQueue.remove(job);
        idleAgents[0].runJob(job);
    }
    // need to try to match a job with an available Runner.
});

// eof initialization

function setupConnection(socket: SocketIO.Server) {
    // @todo: define the types for the data.
    socket.on('benchmark_task', (data: any) => {
        const job = new BenchmarkJob({
            ...data,
            socket
        });

        incomingQueue.push(job);
    });
}

export async function runHub(server: Express.Application) {
    const socketServer: SocketIO.Server = socketIO(server, { path: '/hub' });

    socketServer.on('connect', setupConnection);
}

export default { runHub };
