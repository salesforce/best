import path from "path";
import { isInteractive as globaIsInteractive, clearLine } from "@best/utils";
import chalk from "chalk";
import trimPath from "./utils/trim-path";
import countEOL from "./utils/count-eod";

enum State {
    QUEUED = 'QUEUED',
    RUNNING = 'RUNNING',
    DONE = 'DONE',
}

interface BenchmarkRunnerState { state: State; displayPath: string; projectName: string }
type AllBencharkRunnerState = Map<string, BenchmarkRunnerState>

const STATE_ANSI = {
    RUNNING: chalk.reset.inverse.yellow.bold(` ${State.RUNNING} `),
    QUEUED: chalk.reset.inverse.gray.bold(`  ${State.QUEUED}  `),
    DONE: chalk.reset.inverse.green.bold(`   ${State.DONE}   `)
};

const INIT_MSG = '\n Running benchmarks... \n\n';

function printState(state: State) {
    return STATE_ANSI[state];
}

function printDisplayName(displayPath: string, overflow: number) {
    const dirname = overflow ? trimPath(path.dirname(displayPath), overflow) : path.dirname(displayPath);
    const basename = path.basename(displayPath);
    return chalk.dim(dirname + path.sep) + chalk.bold(basename);
}

function printProjectName(projectName: string) {
    return ' ' + chalk.reset.cyan.dim(`(${projectName})`);
}

interface BuildConfig {
    benchmarkName: string,
    benchmarkFolder: string,
    benchmarkSignature: string,
    benchmarkEntry: string,
    projectConfig: any,
    globalConfig: any,
}

export default class BuildOutputStream {
    stdout: NodeJS.WriteStream;
    isInteractive: boolean;
    _streamBuffer: string = '';
    _state: AllBencharkRunnerState;
    _innerLog: string = '';
    _scheduled: NodeJS.Timeout | null = null;

    constructor(buildConfig: BuildConfig[], stream: NodeJS.WriteStream, isInteractive?: boolean) {
        this.stdout = stream;
        this.isInteractive = isInteractive !== undefined ? isInteractive : globaIsInteractive;
        this._state = this.initState(buildConfig);
    }

    initState(buildConfig: BuildConfig[]) {
        return buildConfig.reduce((state: AllBencharkRunnerState, build: any) => {
            return state;
        }, new Map());
    }

    clearBufferStream() {
        let buffer = this._streamBuffer;
        const lines = countEOL(buffer);

        if (lines) {
            buffer = '\r\x1B[K\r\x1B[1A'.repeat(lines);
        }
        clearLine(this.stdout);
        this.stdout.write(buffer);
        this._streamBuffer = '';
    }

    writeBufferStream(str: string) {
        this._streamBuffer += str;
        this.stdout.write(str);
    }

    updateRunnerState(benchmarkPath: string, state: State) {
        const stateConfig = this._state.get(benchmarkPath);
        if (!stateConfig) {
            throw new Error(`Unknown benchmark build started  (${benchmarkPath})`);
        }
        stateConfig.state = state;
    }

    scheduleUpdate() {
        if (!this._scheduled) {
            this._scheduled = setTimeout(() => {
                this.updateStream();
                this._scheduled = null;
            }, 10);
        }
    }

    printRunner({ state, projectName, displayPath }:{ state: State, projectName: string, displayPath: string }) {
        const columns = this.stdout.columns || 80;
        const overflow = columns - (state.length + projectName.length + displayPath.length + /* for padding */ 10);
        const hasOverflow = overflow < 0;

        const ansiState = printState(state);
        const ansiProjectName = printProjectName(projectName);
        const ansiDisplayname = printDisplayName(displayPath, hasOverflow ? Math.abs(overflow): 0);

        return `${ansiState} ${ansiProjectName} ${ansiDisplayname}\n`;
    }

    updateStream() {
        const innerState = this._innerLog;
        let buffer = INIT_MSG;
        for (const { state, displayPath, projectName } of this._state.values()) {
            buffer += this.printRunner({ state, displayPath, projectName });
        }

        if (innerState) {
            buffer += `\n${innerState}\n`;
        }

        this.clearBufferStream();
        this.writeBufferStream(buffer);
    }

    log(message: string) {
        this._innerLog = message;
        if (this.isInteractive) {
            this.scheduleUpdate();
        } else {
            this.stdout.write(` :: ${message}\n`);
        }
    }

    init() {
        if (this.isInteractive) {
            this.updateStream();
        } else {
            this.stdout.write(INIT_MSG);
        }
    }

    finish() {
        if (this._scheduled) {
            clearTimeout(this._scheduled);
            this._scheduled = null;
        }

        if (this.isInteractive) {
            this.updateStream();
        } else {
            this.stdout.write('\n');
        }
    }
}
