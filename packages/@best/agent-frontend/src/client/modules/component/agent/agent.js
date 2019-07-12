import { LightningElement, track, api } from 'lwc';

import { connect } from 'store/socket';

export default class ComponentAgent extends LightningElement {
    @track jobs = [];
    @api host = '';
    @api name = '';


    connectedCallback() {
        const socket = connect(this.host, { path: '/best', query: { frontend: true } });

        socket.on('connect', (message) => {
            console.log('[connect]', message)
        })
        socket.on('disconnect', (message) => {
            console.log('[disconnect]', message)
        })
        socket.on('error', (message) => {
            console.log('[error]', message)
        })

        socket.on('benchmark_task', (message) => {
            this.jobs.push({
                ...message,
                status: 'QUEUED'
            });
        })
        
        socket.on('running_benchmark_start', (message) => {
            this.jobs = this.jobs.map(job => {
                if (job.socketId === message.socketId) {
                    return {
                        ...job,
                        status: 'RUNNING'
                    }
                }

                return job;
            })
        })

        socket.on('running_benchmark_update', (message) => {
            this.jobs = this.jobs.map(job => {
                if (job.socketId === message.socketId) {
                    return {
                        ...job,
                        args: {
                            ...job.args,
                            ...message.args
                        }
                    }
                }

                return job;
            })
        })

        socket.on('running_benchmark_end', (message) => {
            this.jobs = this.jobs.filter(j => j.socketId !== message.socketId);
        })
    }
}
