import * as args from './args';
import yargs from 'yargs';

export async function run(maybeArgv) {
    const argv = yargs(maybeArgv || process.argv.slice(2))
        .usage(args.usage)
        .alias('help', 'h')
        .options(args.options)
        .epilogue(args.docs)
        .check(args.check)
        .version(false).argv;
}
