import { LightningElement, api } from 'lwc';

function normalizeTime(sec_num: number) {
    let minutes: any = Math.floor(sec_num / 60);
    let seconds: any = sec_num - minutes * 60;

    if (minutes > 99) {
        return '99:99';
    }

    if (minutes < 10) {
        minutes = '0' + minutes;
    }
    if (seconds < 10) {
        seconds = '0' + seconds;
    }
    return minutes + ':' + seconds;
}

function calculateProgress(
    executedIterations: number,
    executedTime: number,
    iterations: number,
    maxDuration: number,
    minSampleCount: number,
) {
    const avgIteration = executedTime / executedIterations;
    const runtime = parseInt(executedTime / 1000 + '', 10);

    let estimated: number;
    if (iterations) {
        estimated = Math.round((iterations * avgIteration) / 1000) + 1;
    } else if (avgIteration * minSampleCount > maxDuration) {
        estimated = Math.round((minSampleCount * avgIteration) / 1000) + 1;
    } else {
        estimated = maxDuration / 1000;
    }

    return {
        executedIterations,
        estimated: normalizeTime(estimated),
        runtime: normalizeTime(runtime),
        avgIteration,
        percentage: Math.round((runtime * 100) / estimated),
    };
}

export default class ComponentJob extends LightningElement {
    @api benchmarkId?: string;
    @api clientId?: string;
    @api agentId?: string;
    @api executedTime: number = 0;
    @api executedIterations: number = 0;
    @api iterations: number = 0;
    @api maxDuration: number = 0;
    @api minSampleCount: number = 0;

    get isRunning() {
        return true;
    }

    get progress() {
        return calculateProgress(
            this.executedIterations,
            this.executedTime,
            this.iterations,
            this.maxDuration,
            this.minSampleCount,
        );
    }

    get hasEstimate() {
        return false;
    }
}
