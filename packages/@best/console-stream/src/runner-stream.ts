import path from "path";
import { isInteractive as globaIsInteractive, clearLine } from "@best/utils";
import chalk from "chalk";
import trimPath from "./utils/trim-path";
import countEOL from "./utils/count-eod";

enum State {
    QUEUED = 'QUEUED',
    RUNNING = 'RUNNING',
    DONE = 'DONE',
    ERROR = 'ERROR',
}
interface BuildConfig {
    benchmarkName: string,
    benchmarkFolder: string,
    benchmarkSignature: string,
    benchmarkEntry: string,
    projectConfig: { projectName: string, rootDir: string },
    globalConfig: any,
}

interface BenchmarkStatus { state: State; displayPath: string; projectName: string }
type AllBencharkRunnerState = Map<string, BenchmarkStatus>

interface RunnerConfig {
    maxDuration: number;
    minSampleCount: number,
    iterations: number,
}

interface RunnerState {
    executedTime: number,
    executedIterations: number,
    results: any[],
}
interface BenchmarkProgress {
    executedIterations: number,
    estimated: number,
    runtime: number,
    avgIteration: number,
}

const STATE_ANSI = {
    RUNNING: chalk.reset.inverse.yellow.bold(` ${State.RUNNING}  `),
    QUEUED: chalk.reset.inverse.gray.bold(`  ${State.QUEUED}  `),
    ERROR: chalk.reset.inverse.redBright.bold(`  ${State.ERROR}   `),
    DONE: chalk.reset.inverse.green.bold(`   ${State.DONE}   `),

};

const INIT_MSG = '\n Running benchmarks... \n\n';
const PROGRESS_TEXT = chalk.dim('Progress running: ');
const PROGRESS_BAR_WIDTH = 40;
const DEFAULT_TIMEOUT = 60;

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

function calculateBenchmarkProgress(progress: RunnerState, { iterations, maxDuration }: RunnerConfig): BenchmarkProgress {
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
}

function printProgressBar(runTime: number, estimatedTime: number, width: number) {
    // If we are more than one second over the estimated time, highlight it.
    const renderedTime = estimatedTime && runTime >= estimatedTime + 1 ? chalk.bold.yellow(runTime + 's') : runTime + 's';
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
}

export default class BuildOutputStream {
    stdout: NodeJS.WriteStream;
    isInteractive: boolean;

    _streamBuffer: string = '';
    _state: AllBencharkRunnerState;
    _innerLog: string = '';
    _progress: BenchmarkProgress | null = null;
    _scheduled: NodeJS.Timeout | null = null;

    constructor(buildConfig: BuildConfig[], stream: NodeJS.WriteStream, isInteractive?: boolean) {
        this.stdout = stream;
        this.isInteractive = isInteractive !== undefined ? isInteractive : globaIsInteractive;
        this._state = this.initState(buildConfig);
    }

    initState(buildConfigs: BuildConfig[]): AllBencharkRunnerState {
        return buildConfigs.reduce((state: AllBencharkRunnerState, build: any): AllBencharkRunnerState => {
            buildConfigs.forEach(({ benchmarkEntry, projectConfig: { projectName, rootDir }}) => {
                state.set(benchmarkEntry, {
                    projectName,
                    state: State.QUEUED,
                    displayPath: benchmarkEntry,
                });
            });
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
            throw new Error(`Unknown benchmark build started (${benchmarkPath})`);
        }
        if (stateConfig.state !== State.ERROR) {
            stateConfig.state = state;
        }
    }

    scheduleUpdate(time?: number, fn?: Function) {
        if (!this._scheduled) {
            this._scheduled = setTimeout(() => {
                fn ? fn() : this.updateStream();
                this._scheduled = null;
            }, time || DEFAULT_TIMEOUT);
        }
    }

    printBenchmarkState({ state, projectName, displayPath }: { state: State, projectName: string, displayPath: string }) {
        const columns = this.stdout.columns || 80;
        const overflow = columns - (state.length + projectName.length + displayPath.length + /* for padding */ 10);
        const hasOverflow = overflow < 0;

        const ansiState = printState(state);
        const ansiProjectName = printProjectName(projectName);
        const ansiDisplayname = printDisplayName(displayPath, hasOverflow ? Math.abs(overflow): 0);

        return `${ansiState} ${ansiProjectName} ${ansiDisplayname}\n`;
    }

    printProgress(progress: BenchmarkProgress, { displayPath }: BenchmarkStatus): string {
        const benchmarkName = chalk.bold.black(path.basename(displayPath));
        return [
            `\n${PROGRESS_TEXT} ${benchmarkName}`,
            chalk.bold.black('Avg iteration:        ') + progress.avgIteration.toFixed(2) + 'ms',
            chalk.bold.black('Completed iterations: ') + progress.executedIterations,
            printProgressBar(progress.runtime, progress.estimated, 40)
        ].join('\n') + '\n\n';
    }

    updateStream() {
        const progress = this._progress;
        let buffer = INIT_MSG;
        let current: BenchmarkStatus | undefined;
        for (const benchmarkState of this._state.values()) {
            const { state, displayPath, projectName } = benchmarkState;
            buffer += this.printBenchmarkState({ state, displayPath, projectName });
            if (state === State.RUNNING) {
                current = benchmarkState;
            }
        }

        if (current && progress) {
            buffer += this.printProgress(progress, current);
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

    _clearTimeout() {
        if (this._scheduled) {
            clearTimeout(this._scheduled);
            this._scheduled = null;
        }
    }

    // -- Lifecycle
    onBenchmarkStart(benchmarkPath: string) {
        this.updateRunnerState(benchmarkPath, State.RUNNING);
        if (this.isInteractive) {
            this.scheduleUpdate();
        } else {
            const benchmarkState = this._state.get(benchmarkPath);
            if (benchmarkState) {
                this.stdout.write(this.printBenchmarkState(benchmarkState));
            }
        }
    }

    onBenchmarkEnd(benchmarkPath: string) {
        this.updateRunnerState(benchmarkPath, State.DONE);
        this._innerLog = '';

        const benchmarkState = this._state.get(benchmarkPath);
        if (benchmarkState) {
            if (this.isInteractive) {
                if (benchmarkState.state === State.ERROR) {
                    this.updateStream();
                    this.stdout.write('\n');
                } else {
                    this.scheduleUpdate();
                }
            } else {
                this._clearTimeout();
                this.stdout.write(this.printBenchmarkState(benchmarkState) + '\n');
            }
        }
    }

    onBenchmarkError(benchmarkPath: string) {
        this.updateRunnerState(benchmarkPath, State.ERROR);
    }

    updateBenchmarkProgress(state: RunnerState, runtimeOpts: RunnerConfig) {
        const progress = this._progress = calculateBenchmarkProgress(state, runtimeOpts);
        const { executedIterations, avgIteration, estimated, runtime } = progress;
        const runIter = executedIterations.toString().padEnd(5, " ");
        const avgIter = `${avgIteration.toFixed(2)}ms`.padEnd(10, " ");
        const remaining = estimated - runtime;

        if (this.isInteractive) {
            this.scheduleUpdate();
        } else {
            this.scheduleUpdate(2500, () => {
                this.stdout.write(
                    ` :: ran: ${runIter} | avg: ${avgIter} | remainingTime: ${remaining}s \n`
                );
            });
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
        this._clearTimeout();
        if (this.isInteractive) {
            this.updateStream();
        } else {
            this.stdout.write('\n');
        }
    }
}
