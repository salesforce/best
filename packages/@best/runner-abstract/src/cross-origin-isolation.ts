/*
 * Copyright (c) 2019, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: MIT
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/MIT
*/
import { RequestHandler } from "express";

// Enable cross-origin isolation for more consistent and accurate perf timings
// https://developer.chrome.com/blog/cross-origin-isolated-hr-timers/
export function crossOriginIsolation(): RequestHandler {
    // based on https://github.com/fishel-feng/isolated/blob/0d79f10/index.js
    return function isolated(req, res, next): void {
        res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
        res.setHeader('Cross-Origin-Embedder-Policy', 'require-corp');
        next();
    };
}
