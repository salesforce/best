export class Job {
    agentId;
    jobId;
    name;
    status = 'ADDED';

    constructor(jobId, name) {
        this.jobId = jobId;
        this.name = name;
    }

    get progressValue() {
        if (this._time && this._estimatedTime) {
            return (this._time / this.estimatedTime) * 100;
        }

        return 0;
    }

    _estimatedTime;
    get estimatedTime() {
        return this._estimatedTime;
    }

    _completedIterations;
    get completedIterations() {
        return this._completedIterations;
    }

    _time;
    get time() {
        return this._time;
    }

    update({ state, opts }) {
        const { executedIterations, executedTime } = state;
        const { iterations, minSampleCount, maxDuration } = opts;
        const avgIteration = executedTime / executedIterations;
        const runtime = parseInt((executedTime / 1000) + '', 10);

        let estimated;
        if (iterations) {
            estimated = Math.round(iterations * avgIteration / 1000) + 1;
        } else if (avgIteration * minSampleCount > maxDuration) {
            estimated = Math.round(minSampleCount * avgIteration / 1000) + 1;
        } else {
            estimated = maxDuration / 1000;
        }

        this._time = runtime;
        this._estimatedTime = estimated;
    }

    results(count) {
        this.status = 'COMPLETED';
        this._completedIterations = count;
    }

    objectified() {
        const { agentId, jobId, name, status, progressValue, estimatedTime, completedIterations, time } = this;
        return { agentId, jobId, name, status, progressValue, estimatedTime, completedIterations, time };
    }
}