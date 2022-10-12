/*
 * Copyright (c) 2019, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: MIT
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/MIT
 */

import isCi from 'is-ci';

const isCI: boolean = isCi;
const isInteractive: boolean = Boolean(process.stdout.isTTY) && !isCI;

export { isCI, isInteractive };
