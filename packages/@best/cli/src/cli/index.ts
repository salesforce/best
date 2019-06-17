import { normalize, usage, options, docs, check } from './args';
import Output from './output';
import yargs from 'yargs';
import rimraf from 'rimraf';
import { getConfigs, BestCliOptions } from '@best/config';
import { OutputStream } from '@best/console-stream';
import { logError } from "@best/utils";
import { runBest } from '../run_best';
import { runCompare } from '../run_compare';
import { ProjectConfigs, FrozenProjectConfig } from '@best/config';

export function buildArgs(maybeArgv?: string[]): BestCliOptions {
    const parsedArgs = yargs(maybeArgv || process.argv.slice(2))
        .usage(usage)
        .alias('help', 'h')
        .options(options)
        .epilogue(docs)
        .check(check)
        .version(false).argv;

    return normalize(parsedArgs);
}

function getProjectListFromCLIArgs(argsCLI: BestCliOptions, project?: string): string[] {
    const projects = argsCLI.projects;

    if (project) {
        projects.push(project);
    }

    if (!projects.length) {
        projects.push(process.cwd());
    }

    return projects;
}

export async function run(maybeArgv?: string[], project?: string) {
    try {
        const argsCLI = buildArgs(maybeArgv);
        const projects = getProjectListFromCLIArgs(argsCLI, project);
        await runCLI(argsCLI, projects);
    } catch (error) {
        const errParts: string[] = error.stack ? error.stack.split('\n') : ['unknown', 'unknown'];
        const errTitle = errParts.shift();
        if (errTitle) {
            logError(errTitle);
        }
        console.warn(errParts.join('\n'));
        process.exit(1);
        throw error;
    }
}

export async function runCLI(argsCLI: BestCliOptions, projects: string[]) {
    const outputStream = new OutputStream(process.stdout);
    let projectConfigs: ProjectConfigs;
    let results;

    try {
        outputStream.write('Looking for Best configurations...');
        projectConfigs = await getConfigs(projects, argsCLI);
    } finally {
        outputStream.clearLine();
    }

    const { globalConfig, configs } = projectConfigs;

    if (argsCLI.showConfigs) {
        outputStream.writeln(JSON.stringify({ globalConfig, configs }, null, '  '));
        return process.exit(0);
    }

    if (argsCLI.clearCache) {
        configs.forEach((config : FrozenProjectConfig) => {
            rimraf.sync(config.cacheDirectory);
            outputStream.writeln(`Cleared ${config.cacheDirectory}`);
        });
        return process.exit(0);
    }

    const output = new Output(globalConfig, outputStream);
    if (argsCLI.compareStats) {
        results = await runCompare(globalConfig, configs, outputStream);
        if (results) {
            output.compare(results);
        }
    } else {
        if (argsCLI.clearResults) {
            outputStream.writeln('Clearing previous benchmark results...');
            configs.forEach((config: FrozenProjectConfig) => {
                rimraf.sync(config.benchmarkOutput);
                outputStream.writeln(`- Cleared: ${config.benchmarkOutput}`);
            });
        }

        results = await runBest(globalConfig, configs, process.stdout);

        if (!results) {
            throw new Error('AggregatedResult must be present after test run is complete');
        }

        output.report(results);
    }

    return true;
}

export { BestCliOptions };
