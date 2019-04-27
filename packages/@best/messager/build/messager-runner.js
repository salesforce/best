"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const path_1 = __importDefault(require("path"));
const chalk_1 = __importDefault(require("chalk"));
const utils_1 = require("@best/utils");
exports.BUILD_STATE = {
    QUEUED: 'queued',
    RUNNING: 'running',
    DONE: 'done',
    ERROR: 'error',
};
const INIT_RUNNING_TEXT = chalk_1.default.bold.dim('Running benchmarks... \n\n');
const PROGRESS_TEXT = chalk_1.default.dim('Progress running ');
const RUNNING_TEXT = ' RUNNING  ';
const RUNNING = chalk_1.default.reset.inverse.yellow.bold(RUNNING_TEXT) + ' ';
const QUEUED_TEXT = '  QUEUED  ';
const QUEUED = chalk_1.default.reset.inverse.gray.bold(QUEUED_TEXT) + ' ';
const DONE_TEXT = '   DONE   ';
const DONE = chalk_1.default.reset.inverse.green.bold(DONE_TEXT) + ' ';
const ERROR_TEXT = '  ERROR   ';
const ERROR = chalk_1.default.reset.inverse.red.bold(ERROR_TEXT) + ' ';
const PROGRESS_BAR_WIDTH = 40;
const COLUMNS = process.stdout.columns || 80;
const TRUNCATED_TEXT = chalk_1.default.reset.dim('(truncated)');
const TRUNCATED = `.../${TRUNCATED_TEXT}/`;
const printState = (state) => {
    switch (state) {
        case exports.BUILD_STATE.QUEUED:
            return QUEUED;
        case exports.BUILD_STATE.RUNNING:
            return RUNNING;
        case exports.BUILD_STATE.ERROR:
            return ERROR;
        case exports.BUILD_STATE.DONE:
            return DONE;
        default:
            return '';
    }
};
const printBenchmarkEntry = (benchmarkEntry) => {
    if (benchmarkEntry.length > COLUMNS) {
        benchmarkEntry = TRUNCATED + benchmarkEntry.slice(TRUNCATED.length - COLUMNS);
    }
    return chalk_1.default.dim(`${benchmarkEntry}\n`);
};
const printDisplayPath = (relativeDir) => {
    if (relativeDir) {
        const dirname = path_1.default.dirname(relativeDir);
        const basename = path_1.default.basename(relativeDir);
        return chalk_1.default.dim(dirname + path_1.default.sep) + chalk_1.default.bold(basename);
    }
    return '';
};
const printProject = (projectName) => {
    return ' ' + chalk_1.default.reset.cyan.dim(`(${projectName})`);
};
const printError = ({ benchmarkEntry }) => {
    return [
        'Temporary benchmark artifact: ',
        chalk_1.default.dim(`${benchmarkEntry}`),
        '\n',
    ].join('\n');
};
const generateProgressState = (progress, { iterations, maxDuration }) => {
    const { executedIterations, executedTime } = progress;
    const avgIteration = executedTime / executedIterations;
    const runtime = parseInt((executedTime / 1000) + '', 10);
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
    const renderedTime = estimatedTime && runTime >= estimatedTime + 1 ? chalk_1.default.bold.yellow(runTime + 's') : runTime + 's';
    let time = chalk_1.default.bold(`Time:`) + `        ${renderedTime}`;
    if (runTime < estimatedTime) {
        time += `, estimated ${estimatedTime}s`;
    }
    // Only show a progress bar if the test run is actually going to take some time
    if (estimatedTime > 2 && runTime < estimatedTime && width) {
        const availableWidth = Math.min(PROGRESS_BAR_WIDTH, width);
        const length = Math.min(Math.floor(runTime / estimatedTime * availableWidth), availableWidth);
        if (availableWidth >= 2) {
            time += '\n' + chalk_1.default.green('█').repeat(length) + chalk_1.default.white('█').repeat(availableWidth - length);
        }
    }
    return time;
};
const clearStream = (buffer) => {
    let height = 0;
    for (let i = 0; i < buffer.length; i++) {
        if (buffer[i] === '\n') {
            height++;
        }
    }
    return '\r\x1B[K\r\x1B[1A'.repeat(height);
};
class RunnerMessager {
    constructor(benchmarksBundle, globalConfig, outputStream) {
        this._running = null;
        this._out = outputStream.write.bind(outputStream);
        const benchmarksState = benchmarksBundle.reduce((map, { benchmarkName, benchmarkEntry, projectConfig }) => {
            const { projectName } = projectConfig;
            map[`${projectName}:${benchmarkName}`] = {
                state: exports.BUILD_STATE.QUEUED,
                opts: {
                    displayName: benchmarkName,
                    displayPath: path_1.default.relative(projectConfig.cacheDirectory, benchmarkEntry),
                    benchmarkEntry,
                    projectName
                },
            };
            return map;
        }, {});
        this._state = { benchmarks: benchmarksState, buffer: '' };
        this._write();
    }
    onBenchmarkStart(benchmarkName, projectName, overrideOpts) {
        const benchId = `${projectName}:${benchmarkName}`;
        this._running = benchId;
        const bench = this._state.benchmarks[benchId];
        if (overrideOpts) {
            Object.assign(bench.opts, overrideOpts);
        }
        bench.state = exports.BUILD_STATE.RUNNING;
        this._update(true);
    }
    updateBenchmarkProgress(state, opts) {
        this._state.progress = generateProgressState(state, opts);
        this._debounceUpdate();
    }
    onBenchmarkEnd(benchmarkName, projectName) {
        this._running = null;
        const bench = this._state.benchmarks[`${projectName}:${benchmarkName}`];
        if (bench.state !== exports.BUILD_STATE.ERROR) {
            bench.state = exports.BUILD_STATE.DONE;
        }
        this._update(true);
    }
    onBenchmarkError(benchmarkName, projectName) {
        const bench = this._state.benchmarks[`${projectName}:${benchmarkName}`];
        bench.state = exports.BUILD_STATE.ERROR;
    }
    logState(state) {
        this._currentState = state;
        this._update(true);
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
        if (utils_1.isInteractive || force) {
            this._clear();
            this._write();
        }
    }
    _clear() {
        this._out(clearStream(this._state.buffer));
    }
    _write() {
        const progress = this._state.progress;
        const benchmarks = this._state.benchmarks;
        const benchmarkRunning = this._running ? benchmarks[this._running] : null;
        const errors = Object.keys(benchmarks).reduce((str, key) => {
            const { state, opts } = benchmarks[key];
            if (state === exports.BUILD_STATE.ERROR) {
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
                    '\n' + PROGRESS_TEXT + chalk_1.default.bold.black(displayName) + ' ',
                    printBenchmarkEntry(benchmarkEntry),
                    chalk_1.default.bold.black('Avg iteration:        ') + progress.avgIteration.toFixed(2) + 'ms',
                    chalk_1.default.bold.black('Completed iterations: ') + progress.executedIterations,
                ].join('\n') + '\n\n';
            buffer += renderTime(progress.runtime, progress.estimated, 40);
        }
        buffer += this._currentState ? `\n Status: ${this._currentState} \n` : '\n';
        if (errors) {
            buffer += '\n' + errors;
        }
        this._state.buffer = buffer;
        this._out(buffer);
    }
}
exports.default = RunnerMessager;
//# sourceMappingURL=messager-runner.js.map