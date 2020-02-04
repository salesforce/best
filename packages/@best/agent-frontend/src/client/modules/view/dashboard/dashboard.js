import { LightningElement, track } from 'lwc';

import { connect } from 'store/socket';
import { Job } from 'store/model';

export default class ViewDashboard extends LightningElement {
    config = { host: window.location.origin, path: '/best' };

    @track agents = [];
    @track hubStats = null;
    @track agentStats = null;
    @track agentSpecs = [];
    allJobs = [];

    connectedCallback() {
        const socket = connect(this.config.host, { path: this.config.path, query: { frontend: true } });

        socket.on('connect', this.socketConnect.bind(this))
        socket.on('disconnect', this.socketDisconnect.bind(this))
        socket.on('error', this.socketError.bind(this))

        socket.on('benchmark added', this.added.bind(this));
        socket.on('benchmark queued', this.queued.bind(this));
        socket.on('benchmark start', this.start.bind(this));
        socket.on('benchmark update', this.update.bind(this));
        socket.on('benchmark error', this.error.bind(this));
        socket.on('benchmark cancel', this.cancel.bind(this));
        socket.on('benchmark results', this.results.bind(this));
        socket.on('stats update', this.stats.bind(this));
        socket.on('specs update', this.specs.bind(this));
    }

    // GETTERS

    get hasJobs() {
        return this.allJobs.length > 0;
    }

    get hasHubStats () {
        return this.hubStats !== null;
    }

    get hasAgentStats () {
        return this.agentStats !== null;
    }

    // HELPERS

    addAgent(agentId) {
        this.agents.push({ agentId, jobs: [] })
    }

    updateAgentsJob(updatedJob) {
        if (! updatedJob.agentId) { return; }
        let agentIndex = this.agents.findIndex(a => a.agentId === updatedJob.agentId);
        if (agentIndex === -1) {
            this.addAgent(updatedJob.agentId);
            agentIndex = this.agents.length - 1;
        }

        const agent = this.agents[agentIndex];
        const jobIndex = agent.jobs.findIndex(j => j.jobId === updatedJob.jobId);
        if (jobIndex === -1) {
            agent.jobs.unshift(updatedJob.objectified());
        } else {
            agent.jobs[jobIndex] = updatedJob.objectified();
        }
    }

    switchAgentForJob(oldAgentId, updatedJob) {
        let oldAgent = this.agents.find(a => a.agentId === oldAgentId);
        const oldJobIndex = oldAgent.jobs.findIndex(j => j.jobId === updatedJob.jobId);
        oldAgent.jobs.splice(oldJobIndex, 1);

        this.updateAgentsJob(updatedJob);
    }

    // SOCKET

    socketConnect() {
        // console.log('[connect]')
    }

    socketDisconnect() {
        // console.log('[disconnect]', event)
    }

    socketError() {
        // console.log('[error]', event)
    }

    // BENCHMARK

    added(event) {
        const job = new Job(event.jobId, event.packet.benchmarkName);
        job.agentId = event.agentId;
        this.allJobs.push(job);
        this.updateAgentsJob(job);
    }

    queued(event) {
        const index = this.allJobs.findIndex(j => j.jobId === event.jobId);
        const job = this.allJobs[index];
        job.status = 'QUEUED';

        if (event.agentId !== job.agentId) {
            const oldAgentId = job.agentId;
            job.agentId = event.agentId;
            this.switchAgentForJob(oldAgentId, job);
        } else {
            job.agentId = event.agentId;
            this.updateAgentsJob(job);
        }
    }

    start(event) {
        const index = this.allJobs.findIndex(j => j.jobId === event.jobId);
        const job = this.allJobs[index];
        job.status = 'RUNNING';

        if (event.agentId !== job.agentId) {
            const oldAgentId = job.agentId;
            job.agentId = event.agentId;
            this.switchAgentForJob(oldAgentId, job);
        } else {
            job.agentId = event.agentId;
            this.updateAgentsJob(job);
        }
    }

    update(event) {
        const index = this.allJobs.findIndex(j => j.jobId === event.jobId);
        const job = this.allJobs[index];
        job.update(event.packet);

        this.updateAgentsJob(job);
    }

    results(event) {
        const index = this.allJobs.findIndex(j => j.jobId === event.jobId);
        const job = this.allJobs[index];
        job.results(event.packet.resultCount);

        this.updateAgentsJob(job);
    }

    error(event) {
        const index = this.allJobs.findIndex(j => j.jobId === event.jobId);
        const job = this.allJobs[index];
        job.status = 'ERROR';

        this.updateAgentsJob(job);
    }

    cancel(event) {
        const index = this.allJobs.findIndex(j => j.jobId === event.jobId);
        const job = this.allJobs[index];
        job.status = 'CANCELLED';

        this.updateAgentsJob(job);
    }

    stats(event) {
        this.hubStats = event.packet.hub;
        this.agentStats = event.packet.agentManager;
    }

    specs(event) {
        this.agentSpecs = event.packet.specs;
    }
}
