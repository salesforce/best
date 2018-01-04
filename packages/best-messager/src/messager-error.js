import chalk from 'chalk';

const ERR_TEXT = chalk.reset.inverse.red.bold('  ERROR   ') + '  ';

export function print(errorMsg, stack, stream = process.stdout) {
    stream.write(ERR_TEXT + errorMsg + (stack ? '\n' + stack : '') + '\n');
}
