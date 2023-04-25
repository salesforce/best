/*
 * Copyright (c) 2019, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: MIT
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/MIT
 */

// Find the full example of all available configuration options at
// https://github.com/muenzpraeger/create-lwc-app/blob/main/packages/lwc-services/example/lwc-services.config.js
module.exports = {
    moduleDir: './src/modules',
    resources: [
        {
            from: 'src/resources/',
            to: 'dist/resources/',
        },
        {
            from: '../../../node_modules/plotly.js-basic-dist-min/plotly-basic.min.js',
            to: 'dist/plotly.min.js',
        },
    ],
};
