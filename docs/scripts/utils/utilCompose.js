/*
 * Copyright (c) 2019, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: MIT
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/MIT
*/

module.exports = function compose(...processors) {
    if (processors.length === 0) return input => input;
    if (processors.length === 1) return processors[0];
    return processors.reduce((prev, next) => {
        return (...args) => next(prev(...args));
    });
};
