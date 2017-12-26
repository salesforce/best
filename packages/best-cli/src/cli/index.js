import * as args from './args';
import yargs from 'yargs';
import rimraf from 'rimraf';
import { getConfigs } from "best-config";
import { runBest } from "../run_best";

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
        const { results, globalConfig } = await runCLI(argsCLI, projects);
        console.log('FINISH >>', results, globalConfig);
    } catch (error) {
        console.log(error);
        process.exit(1);
        throw error;
    }
}

export async function runCLI(argsCLI, projects) {
    const outputStream = process.stdout;
    const { globalConfig, configs, /*hasDeprecationWarnings*/ } = getConfigs(projects, argsCLI, outputStream);
    let results;

    if (argsCLI.clearCache) {
        configs.forEach(config => {
            rimraf.sync(config.cacheDirectory);
            process.stdout.write(`Cleared ${config.cacheDirectory}\n`);
        });
        process.exit(0);
    }

    await runBest(globalConfig, configs, outputStream, (r) => (results = r));

    if (!results) {
        throw new Error('AggregatedResult must be present after test run is complete');
    }

    return Promise.resolve({ globalConfig, results });
}
