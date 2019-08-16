/*
 * Copyright (c) 2019, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: MIT
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/MIT
*/

import chalk from 'chalk';

const ERR_TEXT = chalk.reset.inverse.red.bold('  ERROR   ') + '  ';

export default function logError(errorMsg: string, stack?: string, stream = process.stdout) {
    stream.write(ERR_TEXT + errorMsg + (stack ? '\n' + stack : '') + '\n');
}
