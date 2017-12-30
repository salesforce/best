import { clearLine, isInteractive } from 'best-utils';

import chalk from 'chalk';

export const print = (message, stream) => {
    if (isInteractive) {
        stream.write(chalk.bold.dim(message));
    }
};

export const clear = (stream) => {
    if (isInteractive) {
        clearLine(stream);
    }
};
