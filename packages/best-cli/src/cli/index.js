import * as args from './args';
import Output from './output';
import yargs from 'yargs';
import rimraf from 'rimraf';
import { getConfigs } from '@best/config';
import { preRunMessager, errorMessager } from '@best/messager';
import { runBest } from '../run_best';
import { runCompare } from '../run_compare';

function buildArgs(maybeArgv) {
    const argsv = yargs(maybeArgv || process.argv.slice(2))
        .usage(args.usage)
        .alias('help', 'h')
        .options(args.options)
        .epilogue(args.docs)
        .check(args.check)
        .version(false).argv;
    return argsv;
}

function getProjectListFromCLIArgs(argsCLI, project) {
    const projects = argsCLI.projects ? argsCLI.projects : [];

    if (project) {
        projects.push(project);
    }

    if (!projects.length) {
        projects.push(process.cwd());
    }

    return projects;
}

export async function run(maybeArgv, project) {
    try {
        const argsCLI = buildArgs(maybeArgv);
        const projects = getProjectListFromCLIArgs(argsCLI, project);
        await runCLI(argsCLI, projects);
    } catch (error) {
        const errParts = error.stack ? error.stack.split('\n') : ['unknown', 'unknown'];
        errorMessager.print(errParts.shift());
        console.warn(errParts.join('\n'));
        process.exit(1);
        throw error;
    }
}

export async function runCLI(argsCLI, projects) {
    const outputStream = process.stdout;
    let rawConfigs;
    let results;

    try {
        preRunMessager.print('Looking for Best configurations...', outputStream);
        rawConfigs = await getConfigs(projects, argsCLI, outputStream);
    } finally {
        preRunMessager.clear(outputStream);
    }

    const { globalConfig, configs } = rawConfigs;

    if (argsCLI.clearCache) {
        configs.forEach(config => {
            rimraf.sync(config.cacheDirectory);
            process.stdout.write(`Cleared ${config.cacheDirectory}\n`);
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
            preRunMessager.print('Clearing previous benchmark results...', outputStream);
            configs.forEach(config => {
                rimraf.sync(config.benchmarkOutput);
                process.stdout.write(`\n - Cleared: ${config.benchmarkOutput}\n`);
            });
        }

        results = await runBest(globalConfig, configs, outputStream);

        if (!results) {
            throw new Error('AggregatedResult must be present after test run is complete');
        }

        output.report(results);
    }

    return true;
}
