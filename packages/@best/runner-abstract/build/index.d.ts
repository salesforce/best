export default class Runner {
    app: any;
    browserInfo: any;
    page: any;
    browser: any;
    run({ benchmarkName, benchmarkEntry }: {
        benchmarkName: string;
        benchmarkEntry: string;
    }, projectConfig: any, globalConfig: any, messager: any): Promise<{
        results: any;
        environment: {
            hardware: {
                system: {
                    manufacturer: string;
                    model: string;
                };
                cpu: {
                    manufacturer: string;
                    brand: string;
                    family: string;
                    model: string;
                    speed: string;
                    cores: number;
                };
                os: {
                    platform: string;
                    distro: string;
                    release: string;
                    kernel: string;
                    arch: string;
                };
            };
            runtime: {
                load: {
                    cpuLoad: number;
                };
            };
            browser: any;
            configuration: {
                project: {
                    projectName: any;
                    benchmarkOnClient: any;
                    benchmarkRunner: any;
                    benchmarkEnvironment: any;
                    benchmarkIterations: any;
                };
                global: {
                    gitCommitHash: any;
                    gitHasLocalChanges: any;
                    gitBranch: any;
                    gitRepository: any;
                };
            };
        };
    }>;
    loadUrl(url: string, projectConfig: any): void;
    closeBrowser(): void;
    reloadPage(page: any): void;
    runIteration(...args: any): any;
    runServerIterations(...args: any): void;
    normalizeRuntimeOptions(projectConfig: any): {
        maxDuration: any;
        minSampleCount: any;
        iterations: any;
        iterateOnClient: any;
    };
    initializeBenchmarkState(opts: any): {
        executedTime: number;
        executedIterations: number;
        results: never[];
        iterateOnClient: any;
    };
    runSetupAndGetUrl(benchmarkEntry: string, { useHttp }: any): Promise<string>;
    normalizeEnvironment(browser: any, projectConfig: any, globalConfig: any): Promise<{
        hardware: {
            system: {
                manufacturer: string;
                model: string;
            };
            cpu: {
                manufacturer: string;
                brand: string;
                family: string;
                model: string;
                speed: string;
                cores: number;
            };
            os: {
                platform: string;
                distro: string;
                release: string;
                kernel: string;
                arch: string;
            };
        };
        runtime: {
            load: {
                cpuLoad: number;
            };
        };
        browser: any;
        configuration: {
            project: {
                projectName: any;
                benchmarkOnClient: any;
                benchmarkRunner: any;
                benchmarkEnvironment: any;
                benchmarkIterations: any;
            };
            global: {
                gitCommitHash: any;
                gitHasLocalChanges: any;
                gitBranch: any;
                gitRepository: any;
            };
        };
    }>;
    runIterations(page: any, state: any, opts: any, messager: any): Promise<any>;
    runClientIterations(page: any, state: any, opts: any, messager: any): Promise<any>;
}
