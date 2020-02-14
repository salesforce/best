import { LightningElement, track } from 'lwc';
import { connect } from 'store/socket';
import { BEST_RPC } from "@best/shared";
import { BrowserSpec, BestAgentState, BenchmarkUpdateState, BenchmarkRuntimeConfig } from '@best/types';

// eslint-disable-next-line no-undef
const host = window.location.origin;
const socketConfig = { path: '/frontend', query: { frontend: true } };

interface DashboardClient {
    clientId: string;
    jobs: number;
    state: string;
    specs?: BrowserSpec;
}

interface DashboardAgent {
    agentId: string;
    state: string;
    specs: BrowserSpec[];
    uri: string;
}

interface BenchmarkStartEnd {
    agentId: string;
    clientId: string;
    benchmarkId: string;
}

interface BenchmarkRemoteUpdate {
    agentId: string;
    clientId: string;
    benchmarkId: string;
    state: BenchmarkUpdateState;
    opts: BenchmarkRuntimeConfig;
}

interface RunningBenchmark {
    benchmarkId: string;
    clientId: string;
    agentId: string;
    executedTime: number;
    executedIterations: number;
    iterations?: number;
    maxDuration?: number;
    minSampleCount?: number;
}

export default class ViewDashboard extends LightningElement {

    @track agents: DashboardAgent[] = [];
    @track clients: DashboardClient[] = [];
    @track activeClients: { agentId: [], clientId: [] }[] = [];
    @track jobs: RunningBenchmark[] = [];

    connectedCallback() {
        const socket = connect(host, socketConfig);

        socket.on(BEST_RPC.AGENT_STATE, this.onAgentState.bind(this));
        socket.on(BEST_RPC.HUB_CONNECTED_AGENT, this.onConnectedAgent.bind(this));
        socket.on(BEST_RPC.HUB_DISCONNECTED_AGENT, this.onDisconnectedAgent.bind(this));
        socket.on(BEST_RPC.AGENT_CONNECTED_CLIENT, this.onConnectedClient.bind(this));
        socket.on(BEST_RPC.AGENT_DISCONNECTED_CLIENT, this.onDisconnectedClient.bind(this));
        socket.on(BEST_RPC.AGENT_QUEUED_CLIENT, this.onQueuedClient.bind(this));
        socket.on(BEST_RPC.BENCHMARK_START, this.onBenchmarkStart.bind(this));
        socket.on(BEST_RPC.BENCHMARK_UPDATE, this.onBenchmarkUpdate.bind(this));
        socket.on(BEST_RPC.BENCHMARK_END, this.onBenchmarkEnd.bind(this));
    }

    onAgentState(state: BestAgentState) {
        console.log(BEST_RPC.AGENT_STATE, state);
        this.agents = state.connectedAgents;
        this.clients = state.connectedClients;
        state.activeClients.forEach(({ agentId, clientId }) => {
            this.setClientState('BUSY', clientId);
            this.setAgentState('BUSY', agentId);
        });
    }

    onConnectedAgent(newAgent: DashboardAgent ) {
        const { agentId } = newAgent;
        console.log(BEST_RPC.HUB_CONNECTED_AGENT, newAgent);
        if (!this.agents.find((agent) => agent.agentId === agentId)) {
            this.agents.push({ ...newAgent, state: newAgent.state || 'IDLE' });
        }
    }

    onDisconnectedAgent(removedAgent: DashboardAgent) {
        const { agentId } = removedAgent;
        console.log(BEST_RPC.HUB_DISCONNECTED_AGENT, removedAgent);
        const index = this.agents.findIndex((agent) => agent.agentId === agentId);
        if (index > -1) {
            this.agents.splice(index, 1);
        }

        const jobIndex = this.jobs.findIndex(j => j.agentId === agentId);
        if (jobIndex > -1) {
            this.jobs.splice(jobIndex, 1);
        }
    }

    onConnectedClient(newClient: DashboardClient) {
        const { clientId } = newClient;
        console.log(BEST_RPC.AGENT_CONNECTED_CLIENT, newClient);
        if (!this.clients.find((client) => client.clientId === clientId)) {
            this.clients.push({ ...newClient });
        }
    }

    onDisconnectedClient(clientId: string) {
        const pos = this.clients.findIndex((c: any) => c.id === clientId);
        this.clients.splice(pos, 1);

        const jobIndex = this.jobs.findIndex(j => j.clientId === clientId);
        if (jobIndex > -1) {
            this.jobs.splice(jobIndex, 1);
        }

    }
    onQueuedClient(...args: any) {
        console.log(BEST_RPC.AGENT_QUEUED_CLIENT, args);
    }

    onBenchmarkStart(bStart: BenchmarkStartEnd) {
        console.log(BEST_RPC.BENCHMARK_START, bStart);
        const agent = this.agents.find(a => a.agentId === bStart.agentId);
        const client = this.clients.find(c => c.clientId === bStart.clientId);
        if (agent && client) {
            this.setClientState('BUSY', client.clientId);
            this.setAgentState('BUSY', agent.agentId);
        }
    }

    onBenchmarkEnd(bEnd: BenchmarkStartEnd) {
        console.log(BEST_RPC.BENCHMARK_END, bEnd);
        const jobIndex = this.jobs.findIndex(j => j.benchmarkId === bEnd.benchmarkId);
        const agent = this.agents.find(a => a.agentId === bEnd.agentId);
        const client = this.clients.find(c => c.clientId === bEnd.clientId);

        if (agent && client) {
            this.setClientState('IDLE', client.clientId);
            this.setAgentState('IDLE', agent.agentId);
        }

        if (jobIndex > -1) {
            this.jobs.splice(jobIndex, 1);
        }
    }

    onBenchmarkUpdate(update: BenchmarkRemoteUpdate) {
        console.log(BEST_RPC.BENCHMARK_UPDATE, update);
        const job = this.jobs.find(j => j.benchmarkId === update.benchmarkId);
        if (!job) {
            this.jobs.push({
                benchmarkId: update.benchmarkId,
                clientId: update.clientId,
                agentId: update.agentId,
                executedTime: update.state.executedTime,
                executedIterations: update.state.executedIterations,
                iterations: update.opts.iterations,
                maxDuration: update.opts.maxDuration,
                minSampleCount: update.opts.minSampleCount
            });

        } else {
            job.executedTime = update.state.executedTime;
            job.executedIterations = update.state.executedIterations;
        }
    }

    // STATE CHANGES

    setClientState(state: string, clientId: string) {
        const client = this.clients.find(c => c.clientId === clientId);
        if (client) {
            client.state = state;
        }
    }

    setAgentState(state: string, agentId: string) {
        const agent = this.agents.find(c => c.agentId === agentId);
        if (agent) {
            agent.state = state;
        }
    }

    // GETTERS

    get connectedClients() {
        return this.clients.length;
    }

    get connectedAgents() {
        return this.agents.length;
    }

    get normalizedAgents() {
        return this.agents.map((agent) => ({ ...agent }));
    }
    get normalizedClients() {
        return this.clients.map((client) => ({ ...client }));
    }

    get hasJobs() {
        return this.jobs.length > 0;
    }
}
