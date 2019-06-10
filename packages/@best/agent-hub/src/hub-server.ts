import socketIO, * as SocketIO from 'socket.io';
import BenchmarkJob from "./BenchmarkJob";
import ObservableQueue from "./utils/ObservableQueue";
import { config } from "./hub-config";
import { Agent } from "./Agent";
import { loadBenchmarkJob } from "./benchmark-loader";
import { createAgentManager } from "./AgentManager";

const incomingQueue = new ObservableQueue<BenchmarkJob>();
const readyQueue = new ObservableQueue<BenchmarkJob>();

const agentsManager = createAgentManager(config.agents);

agentsManager.on('idleagent', (agent: Agent) => {
    for (const job of readyQueue) {
        if (agent.canRunJob(job!)) {
            readyQueue.remove(job!);
            agent.runJob(job!);
            break;
        }
    }
});

incomingQueue.on('item-added', (job: BenchmarkJob) => {
    loadBenchmarkJob(job)
        .then((resolvedJob: BenchmarkJob) => {
            incomingQueue.remove(resolvedJob);
            readyQueue.push(resolvedJob);
        })
        .catch((err: any) => {
            incomingQueue.remove(job);
            // @todo: move to the error queue for accounting process.
            console.log(`Error while processing job with signature: "${job.benchmarkSignature}"` , err);
        });
});

readyQueue.on('item-added', (job: BenchmarkJob) => {
    console.log("Job is ready to be processed", job.benchmarkSignature);

    const agent: Agent | null = agentsManager.getIdleAgentForJob(job);

    if (agent !== null) {
        readyQueue.remove(job);
        agent.runJob(job);
    } else {
        job.socketConnection.emit('benchmark_enqueued', { pending: readyQueue.size - 1 });
    }
});

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
