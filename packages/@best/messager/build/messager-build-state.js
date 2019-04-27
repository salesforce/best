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
    BUILDING: 'building',
    DONE: 'done',
    ERROR: 'error',
};
const INIT_BUILD_TEXT = chalk_1.default.bold.dim('Building benchmarks... \n\n');
const BUILDING_TEXT = ' BUILDING ';
const BUILDING = chalk_1.default.reset.inverse.yellow.bold(BUILDING_TEXT) + ' ';
const QUEUED_TEXT = '  QUEUED  ';
const QUEUED = chalk_1.default.reset.inverse.gray.bold(QUEUED_TEXT) + ' ';
const DONE_TEXT = '  BUILT   ';
const DONE = chalk_1.default.reset.inverse.green.bold(DONE_TEXT) + ' ';
const printState = (state) => {
    switch (state) {
        case exports.BUILD_STATE.QUEUED:
            return QUEUED;
        case exports.BUILD_STATE.BUILDING:
            return BUILDING;
        case exports.BUILD_STATE.DONE:
            return DONE;
        default:
            return '';
    }
};
const printDisplayName = (relativeDir) => {
    const dirname = path_1.default.dirname(relativeDir);
    const basename = path_1.default.basename(relativeDir);
    return chalk_1.default.dim(dirname + path_1.default.sep) + chalk_1.default.bold(basename);
};
const printProject = (projectName) => {
    return ' ' + chalk_1.default.reset.cyan.dim(`(${projectName})`);
};
const clearStream = (buffer) => {
    let height = 0;
    for (let i = 0; i < buffer.length; i++) {
        if (buffer[i] === '\n') {
            height++;
        }
    }
    return height > 1 ? '\r\x1B[K\r\x1B[1A'.repeat(height) : '';
};
class BuildStateMessager {
    constructor(benchmarksBundle, globalConfig, outputStream) {
        this._bufferStream = [];
        this._currentState = '';
        this._out = outputStream.write.bind(outputStream);
        this._wrapStream(process.stderr);
        this._wrapStream(process.stdout);
        const benchmarksState = benchmarksBundle.reduce((map, { config, matches }) => {
            const { projectName } = config;
            matches.forEach((benchmarkPath) => {
                map[`${projectName}:${benchmarkPath}`] = {
                    state: exports.BUILD_STATE.QUEUED,
                    displayPath: path_1.default.relative(globalConfig.rootDir, benchmarkPath),
                    projectName: config.projectName
                };
            });
            return map;
        }, {});
        this._state = { benchmarks: benchmarksState, buffer: '', clear: '' };
        this._update();
    }
    // In order to preserve other writes we need to wrap/unwrap the stream
    // so we can manage how to clear/update
    _wrapStream(stream) {
        const _write = stream.write;
        stream.write = (buffer) => {
            this._bufferStream.push(buffer);
            _write.call(stream, buffer);
        };
        stream.write._original = _write;
    }
    _unwrapStream(stream) {
        if (stream.write._original) {
            stream.write = stream.write._original;
        }
    }
    onBenchmarkBuildStart(benchmarkPath, projectName) {
        const bench = this._state.benchmarks[`${projectName}:${benchmarkPath}`];
        bench.state = exports.BUILD_STATE.BUILDING;
        this._update(true);
    }
    onBenchmarkBuildEnd(benchmarkPath, projectName) {
        const bench = this._state.benchmarks[`${projectName}:${benchmarkPath}`];
        bench.state = exports.BUILD_STATE.DONE;
        this._currentState = '';
        this._update(true);
    }
    logState(state) {
        this._currentState = state;
        this._update();
    }
    finishBuild() {
        this._update(true);
        this._unwrapStream(process.stderr);
        this._unwrapStream(process.stdout);
    }
    _update(force) {
        if (utils_1.isInteractive || force) {
            const _externalBuffer = this._bufferStream.join('');
            const _cleanExternalBuffer = clearStream(_externalBuffer + '\n');
            this._out(_cleanExternalBuffer);
            this._clear();
            this._write();
            this._out(_externalBuffer);
        }
    }
    _clear() {
        this._out(this._state.clear);
    }
    _write() {
        const benchmarks = this._state.benchmarks;
        let buffer = Object.keys(benchmarks).reduce((str, key) => {
            const { state, displayPath, projectName } = benchmarks[key];
            str += printState(state) + printDisplayName(displayPath) + printProject(projectName) + '\n';
            return str;
        }, '\n' + INIT_BUILD_TEXT);
        buffer += this._currentState ? `\n Status: ${this._currentState} \n` : '\n';
        this._state.clear = clearStream(buffer);
        this._out(buffer);
    }
}
exports.default = BuildStateMessager;
//# sourceMappingURL=messager-build-state.js.map