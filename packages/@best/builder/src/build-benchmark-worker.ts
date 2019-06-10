import { buildBenchmark } from "./build-benchmark";

const messagerAdapter = {
    onBenchmarkBuildStart(entry: any, projectName: any) {
        process.send!({
            type: 'messager.onBenchmarkBuildStart',
            benchmarkName: entry,
            projectName
        });
    },
    logState(state: any) {
        process.send!({
            type: 'messager.logState',
            state,
        });
    },
    onBenchmarkBuildEnd(entry: any, projectName: string) {
        process.send!({
            type: 'messager.onBenchmarkBuildEnd',
            benchmarkName: entry,
            projectName
        });
    }
};

process.on('message', async (message) => {
    switch (message.type) {
        case 'build': {
            const result = await buildBenchmark(
                message.entry,
                message.projectConfig,
                message.globalConfig,
                messagerAdapter
            );
            process.send!({
                type: 'result',
                value: result,
            });
            break;
        }
        default:
            break;
    }
});
