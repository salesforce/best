import { getSystemInfo } from '@best/utils';
import express from 'express';
import { dirname, basename, join } from 'path';
import { spawn } from 'child_process';
import { Socket } from 'net';
import { RunnerOutputStream } from "@best/console-stream";

interface RunnerBundle {
    benchmarkName: string,
    benchmarkEntry: string,
    benchmarkFolder: string,
    benchmarkSignature: string
};

const UPDATE_INTERVAL = 300;

export default abstract class AbstractRunner {
    app: any;
    browserInfo: any;
    page: any;
    browser: any;

    async run({ benchmarkName, benchmarkEntry }: RunnerBundle, projectConfig: any, globalConfig: any, messager: RunnerOutputStream) {
        const opts = this.normalizeRuntimeOptions(projectConfig);
        const state = this.initializeBenchmarkState(opts);
        const { projectName } = projectConfig;
        const { openPages } = globalConfig;
        const url = await this.runSetupAndGetUrl(benchmarkEntry, projectConfig);

        // Optionally open benchmarks in a browser for debugging.
        const debugPages = openPages && /^de/i.test(process.env.NODE_ENV || '');
        if (debugPages) {
            spawn('open', [url]);
        }

        try {
            await this.loadUrl(url, projectConfig);
            const environment = await this.normalizeEnvironment(this.browserInfo, projectConfig, globalConfig);
            messager.onBenchmarkStart(benchmarkName, projectName);
            const { results } = await this.runIterations(this.page, state, opts, messager);
            return { results, environment };
        } catch (e) {
            messager.onBenchmarkError(benchmarkName, projectName);
            throw e;
        } finally {
            messager.onBenchmarkEnd(benchmarkName, projectName);
            this.closeBrowser();
            if (this.app && !debugPages) {
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
    runServerIterations(...args: any) {
        throw new Error('runItrunServerIterationseration() must be implemented');
    }

    normalizeRuntimeOptions(projectConfig: any) {
        const { benchmarkIterations, benchmarkOnClient } = projectConfig;
        const definedIterations = Number.isInteger(benchmarkIterations);
        // For benchmarking on the client or a defined number of iterations duration is irrelevant
        const maxDuration = definedIterations ? 1 : projectConfig.benchmarkMaxDuration;
        const minSampleCount = definedIterations ? benchmarkIterations : projectConfig.benchmarkMinIterations;

        return {
            maxDuration,
            minSampleCount,
            iterations: benchmarkIterations,
            iterateOnClient: benchmarkOnClient,
        };
    }

    initializeBenchmarkState(opts: any) {
        return {
            executedTime: 0,
            executedIterations: 0,
            results: [],
            iterateOnClient: opts.iterateOnClient,
        };
    }

    runSetupAndGetUrl(benchmarkEntry: string, { useHttp }: any): Promise<string> {
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

    async runIterations(page: any, state: any, opts: any, messager: any) {
        return state.iterateOnClient
            ? this.runClientIterations(page, state, opts, messager)
            : this.runServerIterations(page, state, opts, messager);
    }

    async runClientIterations(page: any, state: any, opts: any, messager: any) {
        // Run an iteration to estimate the time it will take
        const testResult = await this.runIteration(page, { iterations: 1 });
        const estimatedIterationTime = testResult.executedTime;

        const start = Date.now();
        // eslint-disable-next-line lwc/no-set-interval
        const intervalId = setInterval(() => {
            const executing = Date.now() - start;
            state.executedTime = executing;
            state.executedIterations = Math.round(executing / estimatedIterationTime);
            messager.updateBenchmarkProgress(state, opts);
        }, UPDATE_INTERVAL);

        await this.reloadPage(page);
        const clientRawResults = await this.runIteration(page, opts);
        clearInterval(intervalId);

        const results = clientRawResults.results;
        state.results.push(...results);
        return state;
    }
}
