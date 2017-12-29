import { clearLine, isInteractive } from 'best-utils';

import chalk from 'chalk';

export const print = (stream) => {
    if (isInteractive) {
        stream.write(chalk.bold.dim('Determining benckmark suites to run...'));
    }
};

export const clear = (stream) => {
    if (isInteractive) {
        clearLine(stream);
    }
};
