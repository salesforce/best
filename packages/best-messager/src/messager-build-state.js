import path from "path";
import chalk from "chalk";

export const BUILD_STATE = {
    QUEUED: 'queued',
    BUILDING: 'building',
    DONE: 'done',
    ERROR: 'error'
};
const INIT_BUILD_TEXT = chalk.bold.dim('Building benchmarks... \n\n');
const BUILDING_TEXT = ' BUILDING ';
const BUILDING = chalk.reset.inverse.yellow.bold(BUILDING_TEXT) + ' ';
const QUEUED_TEXT = '  QUEUED  ';
const QUEUED = chalk.reset.inverse.gray.bold(QUEUED_TEXT) + ' ';
const DONE_TEXT = '  BUILT   ';
const DONE = chalk.reset.inverse.green.bold(DONE_TEXT) + ' ';

const printState = (state) => {
    switch (state) {
        case BUILD_STATE.QUEUED: return QUEUED;
        case BUILD_STATE.BUILDING: return BUILDING;
        case BUILD_STATE.DONE: return DONE;
        default: return '';
    }
};

const printDisplayName = (relativeDir) => {
    const dirname = path.dirname(relativeDir);
    const basename = path.basename(relativeDir);
    return chalk.dim(dirname + path.sep) + chalk.bold(basename);
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

export default ({
    _state: null,
    _out: null,

    initBuild(benchmarksBundle, globalConfig, outputStream) {
        this._out = outputStream;
        const benchmarksState = benchmarksBundle.reduce((map, { config, matches }) => {
            matches.forEach((benchmarkPath) => {
                map[benchmarkPath] = {
                    state: BUILD_STATE.QUEUED,
                    displayPath: path.relative(config.rootDir, benchmarkPath)
                };
            });
            return map;
        }, {});

        this._state = { benchmarks: benchmarksState, buffer: '' };
        this._write();
    },
    onBenchmarkBuildStart(id) {
        const bench = this._state.benchmarks[id];
        bench.state = BUILD_STATE.BUILDING;
        this._update();
    },
    onBenchmarkBuildEnd(id) {
        const bench = this._state.benchmarks[id];
        bench.state = BUILD_STATE.DONE;
        this._update();
    },
    finishBuild() {
        this._out.write('\n');
    },
    _update() {
        this._clear();
        this._write();
    },
    _clear() {
        this._out.write(this._state.clear);
    },
    _write() {
        const benchmarks = this._state.benchmarks;
        const buffer = Object.keys(benchmarks).reduce((str, key) => {
            const benchState = benchmarks[key];
            str += printState(benchState.state) + printDisplayName(benchState.displayPath) + '\n';
            return str;
        }, '\n' + INIT_BUILD_TEXT);

        this._state.buffer = buffer;
        this._state.clear = clearStream(buffer);
        this._out.write(buffer);
    }
});
