import path from "path";
import { fork } from "child_process";

export class BuildBenchmarkCluster {
    constructor(numberOfInstances) {
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

    addMessageListener(callback) {
        this.listeners.push(callback);
    }

    tearDown() {
        for (let i = 0; i < this.workers.length; i++) {
            this.workers[i].kill('SIGINT');
        }
    }

    _notifyMessageListeners(worker, message) {
        for (let i = 0, n = this.listeners.length; i < n; i++) {
            this.listeners[i].call(null, worker, message);
        }
    }
}

export async function buildBenchmarksInParallel(benchmarks, projectConfig, globalConfig, messager, cluster) {
    return new Promise((resolve) => {
        const totalBenchmarks = benchmarks.length;
        const results = [];
        let availableJobs = totalBenchmarks;

        const runJob = (worker, entry) => {
            worker.send({
                type: 'build',
                entry,
                projectConfig,
                globalConfig
            });
            availableJobs--;
        };
        const clusterMessageHandler = (worker, message) => {
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
