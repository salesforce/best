import path from 'path';
import chalk from 'chalk';
import { isInteractive } from '@best/utils';

export const BUILD_STATE = {
    QUEUED: 'queued',
    BUILDING: 'building',
    DONE: 'done',
    ERROR: 'error',
};
const INIT_BUILD_TEXT = chalk.bold.dim('Building benchmarks... \n\n');
const BUILDING_TEXT = ' BUILDING ';
const BUILDING = chalk.reset.inverse.yellow.bold(BUILDING_TEXT) + ' ';
const QUEUED_TEXT = '  QUEUED  ';
const QUEUED = chalk.reset.inverse.gray.bold(QUEUED_TEXT) + ' ';
const DONE_TEXT = '  BUILT   ';
const DONE = chalk.reset.inverse.green.bold(DONE_TEXT) + ' ';

const printState = (state: any) => {
    switch (state) {
        case BUILD_STATE.QUEUED:
            return QUEUED;
        case BUILD_STATE.BUILDING:
            return BUILDING;
        case BUILD_STATE.DONE:
            return DONE;
        default:
            return '';
    }
};

const printDisplayName = (relativeDir: string) => {
    const dirname = path.dirname(relativeDir);
    const basename = path.basename(relativeDir);
    return chalk.dim(dirname + path.sep) + chalk.bold(basename);
};

const printProject = (projectName: string) => {
    return ' ' + chalk.reset.cyan.dim(`(${projectName})`);
};

const clearStream = (buffer: string) => {
    let height = 0;
    for (let i = 0; i < buffer.length; i++) {
        if (buffer[i] === '\n') {
            height++;
        }
    }

    return height > 1 ? '\r\x1B[K\r\x1B[1A'.repeat(height) : '';
};

export default class BuildStateMessager {
    _bufferStream: any[];
    _currentState: string;
    _out: any;
    _state: { benchmarks: any; buffer: string; clear: string; };
    constructor(benchmarksBundle: any, globalConfig: any, outputStream: any) {
        this._bufferStream = [];
        this._currentState = '';

        this._out = outputStream.write.bind(outputStream);
        this._wrapStream(process.stderr);
        this._wrapStream(process.stdout);

        const benchmarksState = benchmarksBundle.reduce((map: any, { config, matches }: any) => {
            const { projectName } = config;
            matches.forEach((benchmarkPath: string) => {
                map[`${projectName}:${benchmarkPath}`] = {
                    state: BUILD_STATE.QUEUED,
                    displayPath: path.relative(globalConfig.rootDir, benchmarkPath),
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
    _wrapStream(stream: any) {
        const _write = stream.write;
        stream.write = (buffer: string) => {
            this._bufferStream.push(buffer);
            _write.call(stream, buffer);
        };
        stream.write._original = _write;
    }

    _unwrapStream(stream: any) {
        if (stream.write._original) {
            stream.write = stream.write._original;
        }
    }

    onBenchmarkBuildStart(benchmarkPath: string, projectName: string) {
        const bench = this._state.benchmarks[`${projectName}:${benchmarkPath}`];
        bench.state = BUILD_STATE.BUILDING;
        this._update(true);
    }

    onBenchmarkBuildEnd(benchmarkPath: string, projectName: string) {
        const bench = this._state.benchmarks[`${projectName}:${benchmarkPath}`];
        bench.state = BUILD_STATE.DONE;
        this._currentState = '';
        this._update(true);
    }

    logState(state: any) {
        this._currentState = state;
        this._update();
    }

    finishBuild() {
        this._update(true);
        this._unwrapStream(process.stderr);
        this._unwrapStream(process.stdout);
    }

    _update(force?: boolean) {
        if (isInteractive || force) {
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
