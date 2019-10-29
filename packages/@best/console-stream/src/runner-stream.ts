/*
 * Copyright (c) 2019, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: MIT
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/MIT
*/

import path from "path";
import { isInteractive as globaIsInteractive } from "@best/utils";
import chalk from "chalk";
import trimPath from "./utils/trim-path";
import countEOL from "./utils/count-eod";
import { ProxiedStream, proxyStream } from "./utils/proxy-stream";
import {
    BenchmarkResultsState,
    BenchmarkRuntimeConfig,
    BuildConfig,
    RunnerStream,
} from "@best/types";

enum State {
    QUEUED = 'QUEUED',
    RUNNING = 'RUNNING',
    DONE = 'DONE',
    ERROR = 'ERROR',
}

interface BenchmarkStatus { state: State; displayPath: string; projectName: string }
type AllBencharkRunnerState = Map<string, BenchmarkStatus>

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

function calculateBenchmarkProgress(progress: BenchmarkResultsState, { iterations, maxDuration, minSampleCount }: BenchmarkRuntimeConfig): BenchmarkProgress {
    const { executedIterations, executedTime } = progress;
    const avgIteration = executedTime / executedIterations;
    const runtime = parseInt((executedTime / 1000) + '', 10);

    let estimated: number;
    if (iterations) {
        estimated = Math.round(iterations * avgIteration / 1000) + 1;
    } else if (avgIteration * minSampleCount > maxDuration) {
        estimated = Math.round(minSampleCount * avgIteration / 1000) + 1;
    } else {
        estimated = maxDuration / 1000;
    }

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

export default class RunnerOutputStream implements RunnerStream {
    stdoutColumns: number;
    stdoutWrite: Function;
    isInteractive: boolean;
    _streamBuffer: string = '';
    _state: AllBencharkRunnerState;
    _innerLog: string = '';
    _progress: BenchmarkProgress | null = null;
    _scheduled: NodeJS.Timeout | null = null;
    _proxyStream: ProxiedStream;

    constructor(buildConfig: BuildConfig[], stream: NodeJS.WriteStream, isInteractive?: boolean) {
        this.stdoutColumns = stream.columns || 80;
        this.stdoutWrite = stream.write.bind(stream);
        this.isInteractive = isInteractive !== undefined ? isInteractive : globaIsInteractive;
        this._state = this.initState(buildConfig);
        this._proxyStream = proxyStream(stream, this.isInteractive);
    }

    initState(buildConfigs: BuildConfig[]): AllBencharkRunnerState {
        return buildConfigs.reduce((state: AllBencharkRunnerState): AllBencharkRunnerState => {
            buildConfigs.forEach(({ benchmarkEntry, projectConfig: { projectName }}) => {
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

        if (this.isInteractive) {
            // clear last line
            this.stdoutWrite('\x1b[999D\x1b[K');
        }

        this.stdoutWrite(buffer);
        this._streamBuffer = '';
    }

    writeBufferStream(str: string) {
        this._streamBuffer += str;
        this.stdoutWrite(str);
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
        const columns = this.stdoutColumns;
        const overflow = columns - (state.length + projectName.length + displayPath.length + /* for padding */ 14);
        const hasOverflow = overflow < 0;

        const ansiState = printState(state);
        const ansiProjectName = printProjectName(projectName);
        const ansiDisplayname = printDisplayName(displayPath, hasOverflow ? Math.abs(overflow): 0);

        return `${ansiState} ${ansiProjectName} ${ansiDisplayname}\n`;
    }

    printProgress(progress: BenchmarkProgress, { displayPath }: BenchmarkStatus, streamProxyBuffer?: string): string {
        const benchmarkName = chalk.bold.black(path.basename(displayPath));
        return [
            `\n${PROGRESS_TEXT} ${benchmarkName}`,
            chalk.bold.black('Avg iteration:        ') + progress.avgIteration.toFixed(2) + 'ms',
            chalk.bold.black('Completed iterations: ') + progress.executedIterations,
            printProgressBar(progress.runtime, progress.estimated, 40),
            streamProxyBuffer ? `Buffered console logs:\n ${streamProxyBuffer}` : ''
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
            buffer += this.printProgress(progress, current, this._proxyStream.readBuffer());
        }

        this.clearBufferStream();
        this.writeBufferStream(buffer);
    }

    log(message: string) {
        this._innerLog = message;
        if (this.isInteractive) {
            this.scheduleUpdate();
        } else {
            this.stdoutWrite(` :: ${message}\n`);
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
                this.stdoutWrite(this.printBenchmarkState(benchmarkState));
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
                    this.stdoutWrite('\n');
                } else {
                    this.scheduleUpdate();
                }
            } else {
                this._clearTimeout();
                this.stdoutWrite(this.printBenchmarkState(benchmarkState) + '\n');
            }
        }
    }

    onBenchmarkError(benchmarkPath: string) {
        this.updateRunnerState(benchmarkPath, State.ERROR);
    }

    updateBenchmarkProgress(state: BenchmarkResultsState, runtimeOpts: BenchmarkRuntimeConfig) {
        const progress = this._progress = calculateBenchmarkProgress(state, runtimeOpts);
        const { executedIterations, avgIteration, estimated, runtime } = progress;
        const runIter = executedIterations.toString().padEnd(5, " ");
        const avgIter = `${avgIteration.toFixed(2)}ms`.padEnd(10, " ");
        const remaining = estimated - runtime;

        if (this.isInteractive) {
            this.scheduleUpdate();
        } else {
            this.scheduleUpdate(2500, () => {
                this.stdoutWrite(
                    ` :: ran: ${runIter} | avg: ${avgIter} | remainingTime: ${remaining}s \n`
                );
            });
        }
    }

    init() {
        if (this.isInteractive) {
            this.updateStream();
        } else {
            this.stdoutWrite(INIT_MSG);
        }
    }

    finish() {
        this._clearTimeout();
        this._proxyStream.unproxyStream();
        if (this.isInteractive) {
            this.updateStream();
        } else {
            this.stdoutWrite('\n');
        }
    }
}
