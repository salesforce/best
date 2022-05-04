/*
 * Copyright (c) 2019, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: MIT
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/MIT
 */

module.exports = function watchMiddleware(liveReload) {
    if (liveReload) {
        return function (req, res, next) {
            // Poor's man monkey-patch
            // (It assume's we send a string - streaming don't work)
            const send = res.send;
            res.send = function (src) {
                send.call(
                    this,
                    src.replace('{{BOTTOM_RUNTIME_PLACEHOLDER}}', '<script src="/reload/reload.js"></script>"'),
                );
            };
            next();
        };
    } else {
        return function watch_noop(req, res, next) {
            next();
        };
    }
};
