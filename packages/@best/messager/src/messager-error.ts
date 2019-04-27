import chalk from 'chalk';

const ERR_TEXT = chalk.reset.inverse.red.bold('  ERROR   ') + '  ';

export function print(errorMsg: string, stack?: string, stream = process.stdout) {
    stream.write(ERR_TEXT + errorMsg + (stack ? '\n' + stack : '') + '\n');
}
