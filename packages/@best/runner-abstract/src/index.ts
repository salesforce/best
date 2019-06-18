import { getSystemInfo } from '@best/utils';
import express from 'express';
import { dirname, basename, join } from 'path';
import { Socket } from 'net';
import { RunnerOutputStream } from "@best/console-stream";
import { FrozenGlobalConfig, FrozenProjectConfig } from '@best/config';

interface RunnerBundle {
    benchmarkName: string,
    benchmarkEntry: string,
    benchmarkFolder: string,
    benchmarkSignature: string
}

interface RuntimeOptions {
    maxDuration: number;
    minSampleCount: number,
    iterations: number,
    iterateOnClient: boolean
}

export interface BenchmarkResultsState {
    executedTime: number,
    executedIterations: number,
    results: any[],
    iterateOnClient: boolean,
}

const UPDATE_INTERVAL = 300;

export default abstract class AbstractRunner {
    app: any;
    browserInfo: any;
    page: any;
    browser: any;

    async run({ benchmarkEntry }: RunnerBundle, projectConfig: FrozenProjectConfig, globalConfig: FrozenGlobalConfig, runnerLogStream: RunnerOutputStream) {
        const { useHttp } = projectConfig;
        const runtimeOptions = this.normalizeRuntimeOptions(projectConfig);
        const state = this.initializeBenchmarkState(runtimeOptions);
        const url = await this.runSetupAndGetUrl(benchmarkEntry, useHttp);

        try {
            await this.loadUrl(url, projectConfig);

            const environment = await this.normalizeEnvironment(this.browserInfo, projectConfig, globalConfig);
            runnerLogStream.onBenchmarkStart(benchmarkEntry);
            const { results } = await this.runIterations(this.page, state, runtimeOptions, runnerLogStream);
            return { results, environment };

        } catch (e) {
            runnerLogStream.onBenchmarkError(benchmarkEntry);
            throw e;
        } finally {
            runnerLogStream.onBenchmarkEnd(benchmarkEntry);
            this.closeBrowser();
            if (this.app) {
                this.app.stop();
            }
        }
    }

    loadUrl(url: string, projectConfig: any) {
        throw new Error('loadUrl() must be implemented');
    }

    closeBrowser() {
        throw new Error('closeBrowser() must be implemented');
    }

    reloadPage(page: any) {
        throw new Error('reloadPage() must be implemented');
    }

    runIteration(...args: any): any {
        throw new Error('runIteration() must be implemented');
    }
    runServerIterations(...args: any): Promise<BenchmarkResultsState> {
        throw new Error('runItrunServerIterationseration() must be implemented');
    }

    normalizeRuntimeOptions(projectConfig: FrozenProjectConfig): RuntimeOptions {
        const { benchmarkIterations, benchmarkOnClient, benchmarkMaxDuration, benchmarkMinIterations } = projectConfig;
        const definedIterations = Number.isInteger(benchmarkIterations);

        // For benchmarking on the client or a defined number of iterations duration is irrelevant
        const maxDuration = definedIterations ? 1 : benchmarkMaxDuration;
        const minSampleCount = definedIterations ? benchmarkIterations : benchmarkMinIterations;

        return {
            maxDuration,
            minSampleCount,
            iterations: benchmarkIterations,
            iterateOnClient: benchmarkOnClient,
        };
    }

    initializeBenchmarkState({ iterateOnClient }: RuntimeOptions): BenchmarkResultsState {
        return {
            executedTime: 0,
            executedIterations: 0,
            results: [],
            iterateOnClient,
        };
    }

    runSetupAndGetUrl(benchmarkEntry: string, useHttp: boolean): Promise<string> {
        if (!useHttp) {
            return Promise.resolve(`file://${benchmarkEntry}`);
        }

        return new Promise(resolve => {
            const dir = dirname(benchmarkEntry);
            const file = basename(benchmarkEntry);
            const publicDir = join(dir, '../public');
            const app: any = this.app = express();
            const server = app.listen(() => {
                const { port }: any = server.address();
                resolve(`http://127.0.0.1:${port}/${file}`);
            });

            // Serve static assets.
            app.use(express.static(dir));
            app.use('/', express.static(publicDir));

            // Keep track of open sockets.
            const sockets: {[key: string]: Socket } = {};
            let socketId = 0;
            server.on('connection', (socket: Socket) => {
                const id = `s${++socketId}`;
                sockets[id] = socket;
                socket.on('close', () => delete sockets[id]);
            });

            // Stop the server by ending open sockets.
            app.stop = () => {
                server.close();
                Object.values(sockets).forEach(socket => {
                    socket.end();
                    socket.unref();
                });
            };
        });
    }

    async normalizeEnvironment(browser: any, projectConfig: any, globalConfig: any) {
        const {
            benchmarkOnClient,
            benchmarkRunner,
            benchmarkEnvironment,
            benchmarkIterations,
            projectName,
        } = projectConfig;
        const { system, cpu, os, load } = await getSystemInfo();
        return {
            hardware: { system, cpu, os },
            runtime: { load },
            browser,
            configuration: {
                project: {
                    projectName,
                    benchmarkOnClient,
                    benchmarkRunner,
                    benchmarkEnvironment,
                    benchmarkIterations,
                },
                global: {
                    gitCommitHash: globalConfig.gitCommit,
                    gitHasLocalChanges: globalConfig.gitLocalChanges,
                    gitBranch: globalConfig.gitBranch,
                    gitRepository: globalConfig.gitRepository,
                },
            },
        };
    }

    async runIterations(page: any, state: BenchmarkResultsState, runtimeOptions: RuntimeOptions, runnnerLogStream: RunnerOutputStream) {
        return state.iterateOnClient
            ? this.runClientIterations(page, state, runtimeOptions, runnnerLogStream)
            : this.runServerIterations(page, state, runtimeOptions, runnnerLogStream);
    }

    async runClientIterations(page: any, state: BenchmarkResultsState, runtimeOptions: RuntimeOptions, runnerLogStream: RunnerOutputStream): Promise<BenchmarkResultsState> {
        // Run an iteration to estimate the time it will take
        const testResult = await this.runIteration(page, { iterations: 1 });
        const estimatedIterationTime = testResult.executedTime;

        const start = Date.now();
        // eslint-disable-next-line lwc/no-set-interval
        const intervalId = setInterval(() => {
            const executing = Date.now() - start;
            state.executedTime = executing;
            state.executedIterations = Math.round(executing / estimatedIterationTime);
            runnerLogStream.updateBenchmarkProgress(state, runtimeOptions);
        }, UPDATE_INTERVAL);

        await this.reloadPage(page);
        const clientRawResults = await this.runIteration(page, runtimeOptions);
        clearInterval(intervalId);

        const results = clientRawResults.results;
        state.results.push(...results);
        return state;
    }
}
