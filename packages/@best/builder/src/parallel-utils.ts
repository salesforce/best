import path from "path";
import { fork } from "child_process";

export class BuildBenchmarkCluster {
    private workers: any[];
    private listeners: any[];

    constructor(numberOfInstances: number) {
        this.workers = [];
        this.listeners = [];
        for (let i = 0; i < numberOfInstances; i++) {
            const worker = fork(path.join(__dirname, 'build-benchmark-worker.js'));
            this.workers.push(worker);

            worker.on("message", (msg) => {
                this._notifyMessageListeners(worker, msg);
            });
        }
    }

    addMessageListener(callback: Function) {
        this.listeners.push(callback);
    }

    tearDown() {
        for (let i = 0; i < this.workers.length; i++) {
            this.workers[i].kill('SIGINT');
        }
    }

    _notifyMessageListeners(worker: any, message: any) {
        for (let i = 0, n = this.listeners.length; i < n; i++) {
            this.listeners[i].call(null, worker, message);
        }
    }
}

export async function buildBenchmarksInParallel(benchmarks: any, projectConfig: any, globalConfig: any, messager: any, cluster: any) {
    return new Promise((resolve) => {
        const totalBenchmarks = benchmarks.length;
        const results: any = [];
        let availableJobs = totalBenchmarks;

        const runJob = (worker: any, entry: any) => {
            worker.send({
                type: 'build',
                entry,
                projectConfig,
                globalConfig
            });
            availableJobs--;
        };
        const clusterMessageHandler = (worker: any, message: any) => {
            if (message.type === 'result') {
                results.push(message.value);

                if (results.length === totalBenchmarks) {
                    resolve(results);
                } else if (availableJobs > 0) {
                    runJob(worker, benchmarks[totalBenchmarks - availableJobs]);
                }
            } else if (message.type === 'messager.onBenchmarkBuildStart') {
                messager.onBenchmarkBuildStart(message.benchmarkName, message.projectName);
            } else if (message.type === 'messager.logState') {
                messager.logState(message.state);
            } else if (message.type === 'messager.onBenchmarkBuildEnd') {
                messager.onBenchmarkBuildEnd(message.benchmarkName, message.projectName);
            }
        };

        cluster.addMessageListener(clusterMessageHandler);

        for (let i = 0; i < cluster.workers.length; i++) {
            if (availableJobs > 0) {
                runJob(cluster.workers[i], benchmarks[totalBenchmarks - availableJobs]);
            }
        }
    });
}
