/*
 * Copyright (c) 2019, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: MIT
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/MIT
*/

const markdown = require('./markdown');
const parseHeaders = require('./parseHeaders');

module.exports = function extractDocHeaders(rawDoc, headers = ['h2', 'h3'], md = markdown()) {
    const tokens = md.parse(rawDoc, {});
    const res = [];

    tokens.forEach((t, i) => {
        if (t.type === 'heading_open' && headers.includes(t.tag)) {
            const title = tokens[i + 1].content;
            const slug = t.attrs.find(([name]) => name === 'id')[1];

            res.push({
                level: parseInt(t.tag.slice(1), 10),
                title: parseHeaders(title),
                slug: slug || md.slugify(title),
            });
        }
    });

    return res;
};
