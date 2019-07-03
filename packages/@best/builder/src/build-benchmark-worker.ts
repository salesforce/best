import { buildBenchmark } from "./build-benchmark";

const messagerAdapter = {
    onBenchmarkBuildStart(benchmarkPath: string) {
        process.send!({
            type: 'messager.onBenchmarkBuildStart',
            benchmarkPath
        });
    },
    log(message: string) {
        process.send!({
            type: 'messager.log',
            message,
        });
    },
    onBenchmarkBuildEnd(benchmarkPath: string) {
        process.send!({
            type: 'messager.onBenchmarkBuildEnd',
            benchmarkPath
        });
    }
};


module.exports = async function (input: any, callback: Function) {
    const result = await buildBenchmark(
        input.benchmark,
        input.projectConfig,
        input.globalConfig,
        messagerAdapter
    );

    callback(null, result);
};
