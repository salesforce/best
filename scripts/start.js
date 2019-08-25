/*
 * Copyright (c) 2019, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: MIT
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/MIT
 */

const BEST_SERVICE_TYPE = process.env.BEST_SERVICE_TYPE;

console.log(`Initializing ${BEST_SERVICE_TYPE}`);

if (BEST_SERVICE_TYPE === 'hub') {
    require('@best/agent-hub').run();
} else if (BEST_SERVICE_TYPE === 'agent') {
    require('@best/agent').run();
}
