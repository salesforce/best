import { LightningElement, track } from 'lwc';
import { connect } from 'store/socket';
import { BEST_RPC } from "@best/shared";

// eslint-disable-next-line no-undef
const host = 'http://localhost:5000' || window.location.origin;
const socketConfig = { path: '/frontend', query: { frontend: true } };

export default class ViewDashboard extends LightningElement {

    @track agents = [];
    @track hubStats = null;
    @track agentStats = null;
    @track agentSpecs = [];
    @track clients: any = [];

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

    onAgentState(...args: any) {
        console.log(BEST_RPC.AGENT_STATE, args);
    }

    onConnectedAgent(...args: any) {
        console.log(BEST_RPC.HUB_CONNECTED_AGENT, args);
    }

    onDisconnectedAgent(...args: any) {
        console.log(BEST_RPC.HUB_DISCONNECTED_AGENT, args);
    }

    onConnectedClient(clientSpecs: any) {
        this.clients.push(clientSpecs);
    }

    onDisconnectedClient(clientId: string) {
        const pos = this.clients.findIndex((c: any) => c.id === clientId);
        this.clients.splice(pos, 1);
    }
    onQueuedClient(...args: any) {
        console.log(BEST_RPC.AGENT_QUEUED_CLIENT, args);
    }

    onBenchmarkStart(...args: any) {
        console.log(BEST_RPC.BENCHMARK_START, args);
    }

    onBenchmarkEnd(...args: any) {
        console.log(BEST_RPC.BENCHMARK_END, args);
    }

    onBenchmarkUpdate(...args: any) {
        console.log(BEST_RPC.BENCHMARK_UPDATE, args);
    }

    // GETTERS

    get connectedClients() {
        return this.clients.length;
    }

    get pendingJobs() {
        return this.clients.reduce((p: number, j: any) => p + j.jobs, 0);
    }

    // HELPERS


}
