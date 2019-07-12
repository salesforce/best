import { LightningElement, api } from 'lwc';

export default class ComponentJob extends LightningElement {
    @api job = {};

    get name() {
        return this.job.args.benchmarkName;
    }

    get statusText() {
        return this.job.status;
    }

    get statusClass() {
        return 'status ' + this.job.status.toLowerCase();
    }

    get executedIterations() {
        return this.job.args.state ? this.job.args.state.executedIterations : 0;
    }

    get isRunning() {
        return this.job.status === 'RUNNING';
    }

    get isCompleted() {
        return this.job.status === 'COMPLETED';
    }

    get statsText() {
        const { runtime, executedIterations } = this.runningStats;

        return `N: ${executedIterations}, T: ${runtime}s`;
    }

    get progressValue() {
        const { runtime, estimated } = this.runningStats;

        if (runtime && estimated) {
            return (runtime / estimated) * 100;
        }

        return this.job.status === 'COMPLETED' ? 100 : 0;
    }

    get estimatedText() {
        const { estimated } = this.runningStats;
        if (estimated) {
            return `${estimated}s`;
        }

        return '';
    }

    get runningStats() {
        if (this.job.status === 'COMPLETED') {
            return { runtime: Math.ceil(this.job.args.state.executedTime / 1000), executedIterations: this.job.args.state.executedIterations };
        } else if (this.job.args.state && this.job.args.opts) {
            const { executedIterations, executedTime } = this.job.args.state;
            const { iterations, maxDuration } = this.job.args.opts;
            const avgIteration = executedTime / executedIterations;
            const runtime = parseInt((executedTime / 1000) + '', 10);
            const estimated = iterations ? Math.round(iterations * avgIteration / 1000) + 1 : maxDuration / 1000;

            return { runtime, estimated }
        }
        
        return {};
    }
}
