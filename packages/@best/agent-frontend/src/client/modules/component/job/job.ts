import { LightningElement, api } from 'lwc';

export default class ComponentJob extends LightningElement {
    @api job: any = {};

    get statusClass() {
        return 'status ' + this.job.status.toLowerCase();
    }

    get isRunning() {
        return this.job.status === 'RUNNING';
    }

    get isCompleted() {
        return this.job.status === 'COMPLETED';
    }

    get statsText() {
        const { time, completedIterations } = this.job;

        return `N: ${completedIterations}, T: ${time}s`;
    }

    get hasEstimate() {
        return !!this.job.estimatedTime;
    }

    get estimatedText() {
        const { estimatedTime } = this.job;

        return `${estimatedTime}s`;
    }
}
