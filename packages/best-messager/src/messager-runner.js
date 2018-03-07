import path from 'path';
import chalk from 'chalk';
import { isInteractive } from '@best/utils';

export const BUILD_STATE = {
    QUEUED: 'queued',
    RUNNING: 'running',
    DONE: 'done',
    ERROR: 'error',
};

const INIT_RUNNING_TEXT = chalk.bold.dim('Running benchmarks... \n\n');
const PROGRESS_TEXT = chalk.dim('Progress running ');
const RUNNING_TEXT = ' RUNNING  ';
const RUNNING = chalk.reset.inverse.yellow.bold(RUNNING_TEXT) + ' ';
const QUEUED_TEXT = '  QUEUED  ';
const QUEUED = chalk.reset.inverse.gray.bold(QUEUED_TEXT) + ' ';
const DONE_TEXT = '   DONE   ';
const DONE = chalk.reset.inverse.green.bold(DONE_TEXT) + ' ';
const ERROR_TEXT = '  ERROR   ';
const ERROR = chalk.reset.inverse.red.bold(ERROR_TEXT) + ' ';
const PROGRESS_BAR_WIDTH = 40;

const printState = state => {
    switch (state) {
        case BUILD_STATE.QUEUED:
            return QUEUED;
        case BUILD_STATE.RUNNING:
            return RUNNING;
        case BUILD_STATE.ERROR:
            return ERROR;
        case BUILD_STATE.DONE:
            return DONE;
        default:
            return '';
    }
};

const printDisplayPath = relativeDir => {
    if (relativeDir) {
        const dirname = path.dirname(relativeDir);
        const basename = path.basename(relativeDir);
        return chalk.dim(dirname + path.sep) + chalk.bold(basename);
    }

    return '';
};

const printProject = projectName => {
    return ' ' + chalk.reset.cyan.dim(`(${projectName})`);
};

const printError = ({benchmarkEntry }) => {
    return [
        'Temporary benchmark artifact: ',
        chalk.dim(`${benchmarkEntry}`),
        '\n',
    ].join('\n');
};

const generateProgressState = (progress, { iterations, maxDuration }) => {
    const { executedIterations, executedTime } = progress;
    const avgIteration = executedTime / executedIterations;
    const runtime = parseInt(executedTime / 1000, 10);
    const estimated = iterations ? Math.round(iterations * avgIteration / 1000) + 1 : maxDuration / 1000;

    return {
        executedIterations,
        estimated,
        runtime,
        avgIteration,
    };
};

const renderTime = (runTime, estimatedTime, width) => {
    // If we are more than one second over the estimated time, highlight it.
    const renderedTime =
        estimatedTime && runTime >= estimatedTime + 1 ? chalk.bold.yellow(runTime + 's') : runTime + 's';

    let time = chalk.bold(`Time:`) + `        ${renderedTime}`;
    if (runTime < estimatedTime) {
        time += `, estimated ${estimatedTime}s`;
    }

    // Only show a progress bar if the test run is actually going to take some time
    if (estimatedTime > 2 && runTime < estimatedTime && width) {
        const availableWidth = Math.min(PROGRESS_BAR_WIDTH, width);
        const length = Math.min(Math.floor(runTime / estimatedTime * availableWidth), availableWidth);
        if (availableWidth >= 2) {
            time += '\n' + chalk.green('█').repeat(length) + chalk.white('█').repeat(availableWidth - length);
        }
    }
    return time;
};

const clearStream = buffer => {
    let height = 0;
    for (let i = 0; i < buffer.length; i++) {
        if (buffer[i] === '\n') {
            height++;
        }
    }
    return '\r\x1B[K\r\x1B[1A'.repeat(height);
};

export default class RunnerMessager {
    constructor(benchmarksBundle, globalConfig, outputStream) {
        this._running = false;
        this._out = outputStream.write.bind(outputStream);

        const benchmarksState = benchmarksBundle.reduce((map, { benchmarkName, benchmarkEntry, projectConfig }) => {
            const { projectName } = projectConfig;
            map[`${projectName}:${benchmarkName}`] = {
                state: BUILD_STATE.QUEUED,
                opts: {
                    displayName: benchmarkName,
                    displayPath: path.relative(projectConfig.cacheDirectory, benchmarkEntry),
                    benchmarkEntry,
                    projectName
                },
            };

            return map;
        }, {});

        this._state = {
            benchmarks: benchmarksState,
            buffer: '',
        };

        this._write();
    }

    onBenchmarkStart(benchmarkName, projectName, overrideOpts) {
        const benchId = `${projectName}:${benchmarkName}`;
        this._running = benchId;
        const bench = this._state.benchmarks[benchId];
        if (overrideOpts) {
            Object.assign(bench.opts, overrideOpts);
        }
        bench.state = BUILD_STATE.RUNNING;
        this._update();
    }

    updateBenchmarkProgress(state, opts) {
        this._state.progress = generateProgressState(state, opts);
        this._debounceUpdate();
    }

    onBenchmarkEnd(benchmarkName, projectName) {
        this._running = null;
        const bench = this._state.benchmarks[`${projectName}:${benchmarkName}`];
        if (bench.state !== BUILD_STATE.ERROR) {
            bench.state = BUILD_STATE.DONE;
        }

        this._update();
    }

    onBenchmarkError(benchmarkName, projectName) {
        const bench = this._state.benchmarks[`${projectName}:${benchmarkName}`];
        bench.state = BUILD_STATE.ERROR;
    }

    finishRun() {
        this._update(true);
    }

    _debounceUpdate() {
        if (!this._queued) {
            this._queued = true;
            setTimeout(() => {
                this._queued = false;
                if (this._running) {
                    this._update();
                }
            }, 300);
        }
    }

    _update(force) {
        if (isInteractive || force) {
            this._clear();
            this._write();
        }
    }

    _clear() {
        this._out(this._state.clear);
    }

    _write() {
        const progress = this._state.progress;
        const benchmarks = this._state.benchmarks;
        const benchmarkRunning = benchmarks[this._running];

        const errors = Object.keys(benchmarks).reduce((str, key) => {
            const { state, opts } = benchmarks[key];
            if (state === BUILD_STATE.ERROR) {
                str += printError(opts);
            }

            return str;
        }, '');

        let buffer = Object.keys(benchmarks).reduce((str, key) => {
            const { state, opts: { displayPath, projectName } } = benchmarks[key];
            str += printState(state) + printDisplayPath(displayPath) + printProject(projectName) + '\n';
            return str;
        }, '\n' + INIT_RUNNING_TEXT);

        if (benchmarkRunning && progress) {
            const { opts: { displayName, benchmarkEntry } } = benchmarkRunning;
            buffer +=
                [
                    '\n' + PROGRESS_TEXT + chalk.bold.black(displayName) + ' ',
                    chalk.dim(`${benchmarkEntry}\n`),
                    chalk.bold.black('Avg iteration:        ') + progress.avgIteration.toFixed(2) + 'ms',
                    chalk.bold.black('Completed iterations: ') + progress.executedIterations,
                ].join('\n') + '\n\n';

            buffer += renderTime(progress.runtime, progress.estimated, 40);
        }

        if (errors) {
            buffer += '\n' + errors;
        }

        this._state.buffer = buffer;
        this._state.clear = clearStream(buffer);
        this._out(buffer);
    }
}
