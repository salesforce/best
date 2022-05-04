/*
 * Copyright (c) 2019, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: MIT
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/MIT
 */

module.exports = (html) =>
    String(html)
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/&#x3A;/g, ':')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>');
