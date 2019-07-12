import { LightningElement, api } from 'lwc';

export default class ComponentJob extends LightningElement {
    @api job = {};

    get hasJob() {
        return Object.keys(this.job).length > 0;
    }

    get name() {
        return this.job.args.benchmarkName;
    }

    get statusText() {
        return this.job.status;
    }

    get executedIterations() {
        return this.job.args.state ? this.job.args.state.executedIterations : 0;
    }
}
