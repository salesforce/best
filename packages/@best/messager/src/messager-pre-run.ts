import chalk from 'chalk';
import { clearLine, isInteractive } from '@best/utils';

export function print(message: string, stream: any) {
    if (isInteractive) {
        stream.write(chalk.bold.dim(message));
    }
}

export function clear(stream: any) {
    if (isInteractive) {
        clearLine(stream);
    }
}
