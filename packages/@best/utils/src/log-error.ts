import chalk from 'chalk';

const ERR_TEXT = chalk.reset.inverse.red.bold('  ERROR   ') + '  ';

export default function logError(errorMsg: string, stack?: string, stream = process.stdout) {
    stream.write(ERR_TEXT + errorMsg + (stack ? '\n' + stack : '') + '\n');
}
