/*
 * Copyright (c) 2019, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: MIT
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/MIT
*/

const md = require('markdown-it');
const LRUCache = require('lru-cache');
const hash = require('hash-sum');
const Config = require('markdown-it-chain');
const emojiPlugin = require('markdown-it-emoji');
const anchorPlugin = require('markdown-it-anchor');
const highlight = require('./markdownPluginHighlights');
const highlightLinesPlugin = require('./markdownPluginHighlightLines');
const preWrapperPlugin = require('./markdownPluginWrapper');
const containerPlugin = require('./markdownPluginContainer');

module.exports = (markdown = {}) => {
    const {
        // externalLinks,
        anchor,
        // toc,
        // plugins,
    } = markdown;

    const config = new Config();

    config.options
        .html(true)
        .highlight(highlight)
        .end()

        .plugin('highlight-lines')
        .use(highlightLinesPlugin)
        .end()

        .plugin('pre-wrapper')
        .use(preWrapperPlugin)
        .end()

        .plugin('container')
        .use(containerPlugin, [
            [
                { type: 'important', defaultTitle: 'Important' },
                { type: 'note', defaultTitle: 'Note' },
                { type: 'tip', defaultTitle: 'Tip' },
                { type: 'example', defaultTitle: 'Example' },
            ],
        ])
        .end()

        .plugin('emoji')
        .use(emojiPlugin)
        .end()

        .plugin('anchor')
        .use(anchorPlugin, [
            Object.assign(
                {
                    slufigy: md.slugify,
                    permalink: true,
                    permalinkBefore: true,
                    permalinkSymbol: '#',
                },
                anchor,
            ),
        ])
        .end();

    // .plugin('toc')
    // .use(tocPlugin, [toc])
    // .end()

    const mdInstance = config.toMd(md, markdown);

    // Override parse to allow cache
    const parse = mdInstance.parse;
    const cache = new LRUCache({ max: 1000 });
    mdInstance.parse = (src, env) => {
        const key = hash(src + env.relativePath);
        const cached = cache.get(key);
        if (cached) {
            return cached;
        } else {
            const tokens = parse.call(mdInstance, src, env);
            cache.set(key, tokens);
            return tokens;
        }
    };

    return mdInstance;
};
