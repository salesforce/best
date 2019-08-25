/*
 * Copyright (c) 2019, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: MIT
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/MIT
*/

/* eslint-disable no-console */
const buildDocumentation = require('./build-documentation');

buildDocumentation().catch(err => {
    console.log(err);
    throw err;
});
