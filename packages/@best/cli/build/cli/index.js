"use strict";
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const args = __importStar(require("./args"));
const output_1 = __importDefault(require("./output"));
const yargs_1 = __importDefault(require("yargs"));
const rimraf_1 = __importDefault(require("rimraf"));
const config_1 = require("@best/config");
const messager_1 = require("@best/messager");
const run_best_1 = require("../run_best");
const run_compare_1 = require("../run_compare");
function buildArgs(maybeArgv) {
    const argsv = yargs_1.default(maybeArgv || process.argv.slice(2))
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
async function run(maybeArgv, project) {
    try {
        const argsCLI = buildArgs(maybeArgv);
        const projects = getProjectListFromCLIArgs(argsCLI, project);
        await runCLI(argsCLI, projects);
    }
    catch (error) {
        const errParts = error.stack ? error.stack.split('\n') : ['unknown', 'unknown'];
        messager_1.errorMessager.print(errParts.shift());
        console.warn(errParts.join('\n'));
        process.exit(1);
        throw error;
    }
}
exports.run = run;
async function runCLI(argsCLI, projects) {
    const outputStream = process.stdout;
    let rawConfigs;
    let results;
    try {
        messager_1.preRunMessager.print('Looking for Best configurations...', outputStream);
        rawConfigs = await config_1.getConfigs(projects, argsCLI);
    }
    finally {
        messager_1.preRunMessager.clear(outputStream);
    }
    const { globalConfig, configs } = rawConfigs;
    if (argsCLI.clearCache) {
        configs.forEach((config) => {
            rimraf_1.default.sync(config.cacheDirectory);
            process.stdout.write(`Cleared ${config.cacheDirectory}\n`);
        });
        return process.exit(0);
    }
    const output = new output_1.default(globalConfig, outputStream);
    if (argsCLI.compareStats) {
        results = await run_compare_1.runCompare(globalConfig, configs, outputStream);
        if (results) {
            output.compare(results);
        }
    }
    else {
        if (argsCLI.clearResults) {
            messager_1.preRunMessager.print('Clearing previous benchmark results...', outputStream);
            configs.forEach((config) => {
                rimraf_1.default.sync(config.benchmarkOutput);
                process.stdout.write(`\n - Cleared: ${config.benchmarkOutput}\n`);
            });
        }
        results = await run_best_1.runBest(globalConfig, configs, outputStream);
        if (!results) {
            throw new Error('AggregatedResult must be present after test run is complete');
        }
        output.report(results);
    }
    return true;
}
exports.runCLI = runCLI;
//# sourceMappingURL=index.js.map