/*
 * Copyright (c) 2019, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: MIT
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/MIT
 */

const dateformat = require('dateformat');
module.exports = function buildBlogPostHeader({ title, subtitle, created_at, author, twitter }) {
    const sub = subtitle ? `<h2>${subtitle}</h2>` : '';
    return `<section class="blog-header">
    <h1>${title}</h1>
    ${sub}
    <h3>
        <a href="${twitter ? `https://twitter.com/${twitter}` : '#'}">${author}</a>
        <time>${dateformat(created_at, 'dddd, mmmm dS, yyyy')}</time>
    </h3>
</section>
`;
};
