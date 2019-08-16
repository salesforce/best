/*
 * Copyright (c) 2019, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: MIT
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/MIT
*/

const DEFAULT_NAVBAR = [
    {
        id: 'guide',
        href: '/guide/introduction',
        text: 'Guide',
    },
    {
        id: 'blog',
        href: '/blog',
        text: 'Blog',
    }
];

module.exports = function buildNavBar({ activeTab } = {}) {
    return DEFAULT_NAVBAR.map(tab => {
        const { id, href, text } = tab;
        const active = id === activeTab;
        return `<li ${active ? 'class="active"' : ''}><a href="${href}">${text}</a></li>`;
    }).join('\n');
};
