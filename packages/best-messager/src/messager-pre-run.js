import chalk from 'chalk';
import { clearLine, isInteractive } from '@best/utils';

export function print(message, stream) {
    if (isInteractive) {
        stream.write(chalk.bold.dim(message));
    }
}

export function clear(stream) {
    if (isInteractive) {
        clearLine(stream);
    }
}
