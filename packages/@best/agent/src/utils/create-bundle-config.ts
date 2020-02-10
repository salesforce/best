import { BuildConfig, BenchmarksBundle } from "@best/types";
import { AgentConfig } from "@best/types";

export function createBundleConfig(benchmarkBuild: BuildConfig, agentConfig: AgentConfig): BenchmarksBundle[] {
    (benchmarkBuild.projectConfig as any).benchmarkRunner = agentConfig.runner;

    return [{
        projectName: benchmarkBuild.projectConfig.projectName,
        projectConfig: benchmarkBuild.projectConfig,
        globalConfig: benchmarkBuild.globalConfig,
        benchmarkBuilds: [benchmarkBuild]
    }];
}
